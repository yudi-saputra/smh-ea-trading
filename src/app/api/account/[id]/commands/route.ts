import { prisma } from "@/lib/db";
import {
  AuthError,
  canExecuteCommands,
  canViewAccounts,
  getSessionUser,
  getTerminalForUser,
} from "@/lib/auth";
import {
  getSessionMember,
  getTerminalForMember,
} from "@/lib/auth-member";
import { isAllowedPhase1Command, normalizeCommandText } from "@/lib/commands";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * Prefer admin session over member when both cookies are present
 * (same rule as GET /api/account).
 */
async function resolveCommandActor() {
  const user = await getSessionUser();
  if (user && canViewAccounts(user.role)) {
    return { kind: "user" as const, user };
  }
  const member = await getSessionMember();
  if (member) return { kind: "member" as const, member };
  if (user) throw new AuthError("Forbidden", 403);
  throw new AuthError("Unauthorized", 401);
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await resolveCommandActor();

    if (actor.kind === "member") {
      const terminal = await getTerminalForMember(actor.member, id);
      if (!terminal) return jsonError("Terminal not found", 404);
      const commands = await prisma.command.findMany({
        where: { terminalId: terminal.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          text: true,
          status: true,
          resultMessage: true,
          createdAt: true,
          ackedAt: true,
        },
      });
      return jsonOk({ ok: true, commands });
    }

    const terminal = await getTerminalForUser(actor.user, id);
    if (!terminal) return jsonError("Terminal not found", 404);

    const commands = await prisma.command.findMany({
      where: { terminalId: terminal.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        text: true,
        status: true,
        resultMessage: true,
        createdAt: true,
        ackedAt: true,
        actor: { select: { id: true, email: true, displayName: true } },
      },
    });
    return jsonOk({ ok: true, commands });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const parsed = await parseJsonBody<{ text?: string }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    if (typeof body.text !== "string" || !body.text.trim()) {
      return jsonError("text required");
    }

    const text = normalizeCommandText(body.text);
    if (!isAllowedPhase1Command(text)) {
      return jsonError(
        "Command not allowed. Use /on /off /pause /reset /status /conservative /aggressive /oneway /twoway /setlayer /setmultiplier /settarget /setcutloss /maxlot /maxlayer /setbaselot /setlayersper /setlotinc /tradetime /tradestart /tradeend",
      );
    }

    const actor = await resolveCommandActor();

    if (actor.kind === "member") {
      const terminal = await getTerminalForMember(actor.member, id);
      if (!terminal) return jsonError("Terminal not found", 404);
      if (!terminal.enabled) return jsonError("Terminal disabled", 400);

      const command = await prisma.command.create({
        data: {
          terminalId: terminal.id,
          text,
          actorMemberId: actor.member.id,
        },
        select: {
          id: true,
          text: true,
          status: true,
          createdAt: true,
        },
      });

      return jsonOk({ ok: true, command }, { status: 201 });
    }

    const user = actor.user;
    if (!canExecuteCommands(user.role)) {
      throw new AuthError("Forbidden", 403);
    }

    const terminal = await getTerminalForUser(user, id);
    if (!terminal) return jsonError("Terminal not found", 404);
    if (!terminal.enabled) return jsonError("Terminal disabled", 400);

    const command = await prisma.command.create({
      data: {
        terminalId: terminal.id,
        text,
        actorUserId: user.id,
      },
      select: {
        id: true,
        text: true,
        status: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "commands.enqueue",
        meta: { commandId: command.id, text, terminalId: terminal.terminalId },
      },
    });

    return jsonOk({ ok: true, command }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
