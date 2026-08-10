import { prisma } from "@/lib/db";
import {
  AuthError,
  canCreateTerminal,
  canSetTerminalExpiry,
  canViewAccounts,
  getTerminalForUser,
  requireUser,
} from "@/lib/auth";
import {
  TERMINAL_ID_RE,
  encryptApiKey,
  generateApiKey,
  hashApiKey,
} from "@/lib/crypto";
import { parseExpiresAt } from "@/lib/expiry";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { PackageStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    if (!canViewAccounts(user.role)) throw new AuthError("Forbidden", 403);

    const { id } = await params;
    const terminal = await getTerminalForUser(user, id);
    if (!terminal) return jsonError("Terminal not found", 404);

    const recentCommands = await prisma.command.findMany({
      where: { terminalId: terminal.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        actor: { select: { id: true, email: true, displayName: true } },
      },
    });

    return jsonOk({
      ok: true,
      terminal: {
        id: terminal.id,
        terminalId: terminal.terminalId,
        name: terminal.name,
        enabled: terminal.enabled,
        expiresAt: terminal.expiresAt?.toISOString() ?? null,
        lastSeenAt: terminal.lastSeenAt,
        packageId: terminal.packageId,
        passwordTrading: terminal.passwordTrading,
        serverBroker: terminal.serverBroker,
        owner: terminal.owner,
        snapshot: terminal.snapshot
          ? {
              ...terminal.snapshot,
              account: terminal.snapshot.account?.toString() ?? null,
              balance: terminal.snapshot.balance?.toString() ?? null,
              equity: terminal.snapshot.equity?.toString() ?? null,
              floatPnl: terminal.snapshot.floatPnl?.toString() ?? null,
              dailyPnl: terminal.snapshot.dailyPnl?.toString() ?? null,
              layer: terminal.snapshot.layer?.toString() ?? null,
              multiplier: terminal.snapshot.multiplier?.toString() ?? null,
              target: terminal.snapshot.target?.toString() ?? null,
              cutloss: terminal.snapshot.cutloss?.toString() ?? null,
              maxLot: terminal.snapshot.maxLot?.toString() ?? null,
            }
          : null,
      },
      commands: recentCommands,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    if (!canCreateTerminal(user.role)) throw new AuthError("Forbidden", 403);

    const { id } = await params;
    const terminal = await getTerminalForUser(user, id);
    if (!terminal) return jsonError("Terminal not found", 404);

    const body = (await req.json()) as {
      name?: string;
      enabled?: boolean;
      rotateApiKey?: boolean;
      expiresAt?: string | null;
      terminalId?: string;
      packageId?: string | null;
      passwordTrading?: string | null;
      serverBroker?: string | null;
    };

    const data: {
      name?: string;
      enabled?: boolean;
      apiKeyHash?: string;
      apiKeyEnc?: string;
      expiresAt?: Date | null;
      terminalId?: string;
      packageId?: string | null;
      passwordTrading?: string | null;
      serverBroker?: string | null;
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.enabled === "boolean") data.enabled = body.enabled;

    if (typeof body.terminalId === "string") {
      const tid = body.terminalId.trim();
      if (!tid) return jsonError("ID Trading wajib diisi", 400);
      if (!TERMINAL_ID_RE.test(tid)) {
        return jsonError("Terminal ID harus berupa [A-Za-z0-9_-]", 400);
      }
      if (tid !== terminal.terminalId) {
        const exists = await prisma.terminal.findUnique({
          where: { terminalId: tid },
          select: { id: true },
        });
        if (exists) {
          return jsonError("Terminal ID sudah dipakai akun lain", 409);
        }
        data.terminalId = tid;
      }
    }

    if (body.packageId !== undefined) {
      const packageId = body.packageId?.trim() || null;
      if (packageId) {
        const pkg = await prisma.package.findFirst({
          where: { id: packageId, status: PackageStatus.ACTIVE },
          select: { id: true },
        });
        if (!pkg) return jsonError("Paket tidak valid atau nonaktif", 400);
        data.packageId = pkg.id;
      } else {
        data.packageId = null;
      }
    }

    if (body.passwordTrading !== undefined) {
      const passwordTrading = body.passwordTrading?.trim() || null;
      if (!passwordTrading) {
        return jsonError("Password Trading wajib diisi", 400);
      }
      data.passwordTrading = passwordTrading;
    }

    if (body.serverBroker !== undefined) {
      const serverBroker = body.serverBroker?.trim() || null;
      if (!serverBroker) {
        return jsonError("Server Broker wajib diisi", 400);
      }
      data.serverBroker = serverBroker;
    }

    if ("expiresAt" in body) {
      if (!canSetTerminalExpiry(user.role)) {
        throw new AuthError("Forbidden", 403);
      }
      const parsed = parseExpiresAt(body.expiresAt);
      if (!parsed.ok) return jsonError(parsed.error);
      data.expiresAt = parsed.date;
    }

    let apiKey: string | undefined;
    if (body.rotateApiKey) {
      apiKey = generateApiKey();
      data.apiKeyHash = hashApiKey(apiKey);
      data.apiKeyEnc = encryptApiKey(apiKey);
    }

    const updated = await prisma.terminal.update({
      where: { id: terminal.id },
      data,
      include: {
        eaPackage: { select: { name: true } },
      },
    });

    if ("expiresAt" in body) {
      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: "terminals.set_expiry",
          meta: {
            id: updated.id,
            terminalId: updated.terminalId,
            expiresAt: updated.expiresAt?.toISOString() ?? null,
          },
        },
      });
    }

    return jsonOk({
      ok: true,
      terminal: {
        id: updated.id,
        terminalId: updated.terminalId,
        name: updated.name,
        enabled: updated.enabled,
        expiresAt: updated.expiresAt?.toISOString() ?? null,
        packageId: updated.packageId,
        packageName: updated.eaPackage?.name ?? null,
        passwordTrading: updated.passwordTrading,
        serverBroker: updated.serverBroker,
      },
      ...(apiKey ? { apiKey } : {}),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser();
    if (!canCreateTerminal(user.role)) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await params;
    const terminal = await getTerminalForUser(user, id);
    if (!terminal) return jsonError("Terminal not found", 404);

    await prisma.terminal.delete({ where: { id: terminal.id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "terminals.delete",
        meta: {
          id: terminal.id,
          terminalId: terminal.terminalId,
          name: terminal.name,
        },
      },
    });

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
