import { MemberStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  AuthError,
  canAccessTerminals,
  canCreateTerminal,
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
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const member = await getSessionMember();
    if (member) {
      const terminals = await prisma.terminal.findMany({
        where: { ownerMemberId: member.id },
        include: {
          snapshot: true,
          memberOwner: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return jsonOk({
        ok: true,
        terminals: terminals.map((t) => ({
          id: t.id,
          terminalId: t.terminalId,
          name: t.name,
          enabled: t.enabled,
          expiresAt: t.expiresAt?.toISOString() ?? null,
          lastSeenAt: t.lastSeenAt,
          owner: t.memberOwner
            ? {
                id: t.memberOwner.id,
                email: t.memberOwner.email,
                displayName: t.memberOwner.name,
              }
            : null,
          snapshot: t.snapshot
            ? {
                status: t.snapshot.status,
                symbol: t.snapshot.symbol,
                balance: t.snapshot.balance?.toString() ?? null,
                equity: t.snapshot.equity?.toString() ?? null,
                positions: t.snapshot.positions,
                floatPnl: t.snapshot.floatPnl?.toString() ?? null,
                dailyPnl: t.snapshot.dailyPnl?.toString() ?? null,
                updatedAt: t.snapshot.updatedAt,
              }
            : null,
        })),
      });
    }

    const user = await requireUser();
    if (!canAccessTerminals(user.role)) {
      throw new AuthError("Forbidden", 403);
    }

    const terminals = await prisma.terminal.findMany({
      where: terminalOwnerFilter(user),
      include: {
        snapshot: true,
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
      terminals: terminals.map((t) => ({
        id: t.id,
        terminalId: t.terminalId,
        name: t.name,
        enabled: t.enabled,
        expiresAt: t.expiresAt?.toISOString() ?? null,
        lastSeenAt: t.lastSeenAt,
        owner: t.memberOwner
          ? {
              id: t.memberOwner.id,
              email: t.memberOwner.email,
              displayName: t.memberOwner.name,
            }
          : t.owner,
        snapshot: t.snapshot
          ? {
              status: t.snapshot.status,
              symbol: t.snapshot.symbol,
              balance: t.snapshot.balance?.toString() ?? null,
              equity: t.snapshot.equity?.toString() ?? null,
              positions: t.snapshot.positions,
              floatPnl: t.snapshot.floatPnl?.toString() ?? null,
              dailyPnl: t.snapshot.dailyPnl?.toString() ?? null,
              updatedAt: t.snapshot.updatedAt,
            }
          : null,
      })),
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

    const body = (await req.json()) as {
      ownerMemberId?: string;
      expiresAt?: string | null;
    };

    const ownerMemberId = body.ownerMemberId?.trim();
    if (!ownerMemberId) {
      return jsonError("Pilih member terlebih dahulu", 400);
    }
    const owner = await prisma.member.findUnique({
      where: { id: ownerMemberId },
    });
    if (!owner || owner.status !== MemberStatus.ACTIVE) {
      return jsonError("Member harus aktif", 400);
    }

    const terminalId = owner.idTrading.trim();
    if (!terminalId) {
      return jsonError("Member belum punya ID Trading", 400);
    }
    if (!TERMINAL_ID_RE.test(terminalId)) {
      return jsonError(
        "ID Trading member harus berupa [A-Za-z0-9_-]",
        400,
      );
    }

    const name = owner.name.trim() || owner.email;

    const expiresParsed = parseExpiresAt(body.expiresAt);
    if (!expiresParsed.ok) return jsonError(expiresParsed.error);

    const exists = await prisma.terminal.findUnique({ where: { terminalId } });
    if (exists) {
      return jsonError("ID Trading ini sudah punya akun", 409);
    }

    const apiKey = generateApiKey();
    const terminal = await prisma.terminal.create({
      data: {
        name,
        terminalId,
        apiKeyHash: hashApiKey(apiKey),
        apiKeyEnc: encryptApiKey(apiKey),
        ownerMemberId: owner.id,
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
