import { prisma } from "@/lib/db";
import {
  AuthError,
  canCreateTerminal,
  canSetTerminalExpiry,
  canViewAccounts,
  getTerminalForUser,
  requireUser,
} from "@/lib/auth";
import { encryptApiKey, generateApiKey, hashApiKey } from "@/lib/crypto";
import { parseExpiresAt } from "@/lib/expiry";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

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
    };

    const data: {
      name?: string;
      enabled?: boolean;
      apiKeyHash?: string;
      apiKeyEnc?: string;
      expiresAt?: Date | null;
    } = {};
    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.enabled === "boolean") data.enabled = body.enabled;

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
