import { MemberStatus, PackageStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  AuthError,
  canCreateTerminal,
  canViewAccounts,
  getSessionUser,
  requireUser,
  terminalOwnerFilter,
} from "@/lib/auth";
import { getSessionMember } from "@/lib/auth-member";
import {
  TERMINAL_ID_RE,
  encryptApiKey,
  generateApiKey,
  hashApiKey,
} from "@/lib/crypto";
import { parseExpiresAt } from "@/lib/expiry";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { parsePasswordTrading } from "@/lib/password-trading";
import {
  mapTerminalListItem,
  snapshotListSelect,
} from "@/lib/terminal-dto";

/**
 * Shared /api/account actor order: admin (staff/super) first, then member.
 * Avoids dual-cookie cases where admin only sees their member-scoped list.
 */
async function resolveAccountListActor() {
  const user = await getSessionUser();
  if (user && canViewAccounts(user.role)) {
    return { kind: "user" as const, user };
  }
  const member = await getSessionMember();
  if (member) return { kind: "member" as const, member };
  if (user) throw new AuthError("Forbidden", 403);
  throw new AuthError("Unauthorized", 401);
}

export async function GET() {
  try {
    const actor = await resolveAccountListActor();

    if (actor.kind === "member") {
      const terminals = await prisma.terminal.findMany({
        where: { ownerMemberId: actor.member.id },
        select: {
          id: true,
          terminalId: true,
          name: true,
          enabled: true,
          expiresAt: true,
          lastSeenAt: true,
          snapshot: { select: snapshotListSelect },
          memberOwner: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return jsonOk({
        ok: true,
        terminals: terminals.map((t) =>
          mapTerminalListItem({
            ...t,
            owner: t.memberOwner
              ? {
                  id: t.memberOwner.id,
                  email: t.memberOwner.email,
                  displayName: t.memberOwner.name,
                }
              : null,
          }),
        ),
      });
    }

    const terminals = await prisma.terminal.findMany({
      where: terminalOwnerFilter(actor.user),
      select: {
        id: true,
        terminalId: true,
        name: true,
        enabled: true,
        expiresAt: true,
        lastSeenAt: true,
        snapshot: { select: snapshotListSelect },
        owner: {
          select: { id: true, email: true, displayName: true },
        },
        memberOwner: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      ok: true,
      terminals: terminals.map((t) =>
        mapTerminalListItem({
          ...t,
          owner: t.memberOwner
            ? {
                id: t.memberOwner.id,
                email: t.memberOwner.email,
                displayName: t.memberOwner.name,
              }
            : t.owner,
        }),
      ),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!canCreateTerminal(user.role)) {
      throw new AuthError("Forbidden", 403);
    }

    const parsed = await parseJsonBody<{
      ownerMemberId?: string;
      terminalId?: string;
      name?: string;
      expiresAt?: string | null;
      packageId?: string;
      passwordTrading?: string;
      serverBroker?: string;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const ownerMemberId =
      typeof body.ownerMemberId === "string" ? body.ownerMemberId.trim() : "";
    if (!ownerMemberId) {
      return jsonError("Pilih member terlebih dahulu", 400);
    }
    const owner = await prisma.member.findUnique({
      where: { id: ownerMemberId },
    });
    if (!owner || owner.status !== MemberStatus.ACTIVE) {
      return jsonError("Member harus aktif", 400);
    }

    // Multi-akun: terminalId bebas per MT5; default ke idTrading member jika kosong.
    const terminalId =
      (typeof body.terminalId === "string" ? body.terminalId.trim() : "") ||
      owner.idTrading.trim();
    if (!terminalId) {
      return jsonError("Terminal ID wajib diisi", 400);
    }
    if (!TERMINAL_ID_RE.test(terminalId)) {
      return jsonError("Terminal ID harus berupa [A-Za-z0-9_-]", 400);
    }

    const passwordRaw =
      (typeof body.passwordTrading === "string"
        ? body.passwordTrading.trim()
        : "") || owner.passwordTrading.trim();
    const passwordParsed = parsePasswordTrading(passwordRaw);
    if (!passwordParsed.ok) return jsonError(passwordParsed.error, 400);
    const passwordTrading = passwordParsed.value;

    const serverBroker =
      (typeof body.serverBroker === "string" ? body.serverBroker.trim() : "") ||
      owner.serverBroker.trim();
    if (!serverBroker) {
      return jsonError("Server Broker wajib diisi", 400);
    }

    const packageId =
      (typeof body.packageId === "string" ? body.packageId.trim() : "") ||
      owner.packageId;
    if (!packageId) {
      return jsonError("Paket wajib dipilih", 400);
    }
    const pkg = await prisma.package.findFirst({
      where: { id: packageId, status: PackageStatus.ACTIVE },
      select: { id: true },
    });
    if (!pkg) {
      return jsonError("Paket tidak valid atau nonaktif", 400);
    }

    const name =
      (typeof body.name === "string" ? body.name.trim() : "") ||
      owner.name.trim() ||
      owner.email;

    const expiresParsed = parseExpiresAt(body.expiresAt);
    if (!expiresParsed.ok) return jsonError(expiresParsed.error);

    // Unique on terminalId — race → P2002 → 409 via handleRouteError
    const apiKey = generateApiKey();
    const terminal = await prisma.terminal.create({
      data: {
        name,
        terminalId,
        apiKeyHash: hashApiKey(apiKey),
        apiKeyEnc: encryptApiKey(apiKey),
        ownerMemberId: owner.id,
        packageId: pkg.id,
        passwordTrading,
        serverBroker,
        createdById: user.id,
        expiresAt: expiresParsed.date,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "terminals.create",
        meta: {
          terminalId: terminal.terminalId,
          id: terminal.id,
          ownerMemberId: owner.id,
          packageId: pkg.id,
          serverBroker,
          expiresAt: terminal.expiresAt?.toISOString() ?? null,
        },
      },
    });

    return jsonOk(
      {
        ok: true,
        terminal: {
          id: terminal.id,
          terminalId: terminal.terminalId,
          name: terminal.name,
          enabled: terminal.enabled,
          expiresAt: terminal.expiresAt?.toISOString() ?? null,
        },
        apiKey,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
