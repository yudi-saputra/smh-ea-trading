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
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { parsePasswordTrading } from "@/lib/password-trading";
import { mapSnapshotDetail } from "@/lib/terminal-dto";
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
        memberOwner: terminal.memberOwner,
        snapshot: mapSnapshotDetail(terminal.snapshot),
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

    const parsed = await parseJsonBody<{
      name?: string;
      enabled?: boolean;
      rotateApiKey?: boolean;
      expiresAt?: string | null;
      terminalId?: string;
      packageId?: string | null;
      passwordTrading?: string | null;
      serverBroker?: string | null;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

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
    const auditFields: string[] = [];

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
      auditFields.push("name");
    }
    if (typeof body.enabled === "boolean") {
      data.enabled = body.enabled;
      auditFields.push("enabled");
    }

    if (typeof body.terminalId === "string") {
      const tid = body.terminalId.trim();
      if (!tid) return jsonError("ID Trading wajib diisi", 400);
      if (!TERMINAL_ID_RE.test(tid)) {
        return jsonError("Terminal ID harus berupa [A-Za-z0-9_-]", 400);
      }
      if (tid !== terminal.terminalId) {
        data.terminalId = tid;
        auditFields.push("terminalId");
      }
    }

    if (body.packageId !== undefined) {
      const packageId =
        typeof body.packageId === "string"
          ? body.packageId.trim() || null
          : body.packageId === null
            ? null
            : undefined;
      if (packageId === undefined) {
        return jsonError("packageId tidak valid", 400);
      }
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
      auditFields.push("packageId");
    }

    if (body.passwordTrading !== undefined) {
      const pw = parsePasswordTrading(
        typeof body.passwordTrading === "string" ? body.passwordTrading : "",
      );
      if (!pw.ok) return jsonError(pw.error, 400);
      data.passwordTrading = pw.value;
      auditFields.push("passwordTrading");
    }

    if (body.serverBroker !== undefined) {
      const serverBroker =
        typeof body.serverBroker === "string"
          ? body.serverBroker.trim()
          : "";
      if (!serverBroker) {
        return jsonError("Server Broker wajib diisi", 400);
      }
      data.serverBroker = serverBroker;
      auditFields.push("serverBroker");
    }

    if ("expiresAt" in body) {
      if (!canSetTerminalExpiry(user.role)) {
        throw new AuthError("Forbidden", 403);
      }
      const exp = parseExpiresAt(body.expiresAt);
      if (!exp.ok) return jsonError(exp.error);
      data.expiresAt = exp.date;
      auditFields.push("expiresAt");
    }

    let apiKey: string | undefined;
    if (body.rotateApiKey === true) {
      apiKey = generateApiKey();
      data.apiKeyHash = hashApiKey(apiKey);
      data.apiKeyEnc = encryptApiKey(apiKey);
      auditFields.push("rotateApiKey");
    }

    if (Object.keys(data).length === 0) {
      return jsonOk({
        ok: true,
        terminal: {
          id: terminal.id,
          terminalId: terminal.terminalId,
          name: terminal.name,
          enabled: terminal.enabled,
          expiresAt: terminal.expiresAt?.toISOString() ?? null,
          packageId: terminal.packageId,
          packageName: null,
          passwordTrading: terminal.passwordTrading,
          serverBroker: terminal.serverBroker,
        },
      });
    }

    const updated = await prisma.terminal.update({
      where: { id: terminal.id },
      data,
      include: {
        eaPackage: { select: { name: true } },
      },
    });

    // fields only — never log passwordTrading / apiKey values
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "terminals.update",
        meta: {
          id: updated.id,
          terminalId: updated.terminalId,
          fields: auditFields,
          ...(auditFields.includes("expiresAt")
            ? { expiresAt: updated.expiresAt?.toISOString() ?? null }
            : {}),
        },
      },
    });

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
