import { prisma } from "@/lib/db";
import {
  AuthError,
  canExecuteCommands,
  getTerminalForUser,
  requireUser,
} from "@/lib/auth";
import {
  getSessionMember,
  getTerminalForMember,
  requireMember,
} from "@/lib/auth-member";
import { isAllowedPhase1Command, normalizeCommandText } from "@/lib/commands";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const member = await getSessionMember();
    if (member) {
      const terminal = await getTerminalForMember(member, id);
      if (!terminal) return jsonError("Terminal not found", 404);
      const commands = await prisma.command.findMany({
        where: { terminalId: terminal.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return jsonOk({ ok: true, commands });
    }

    const user = await requireUser();
    const terminal = await getTerminalForUser(user, id);
    if (!terminal) return jsonError("Terminal not found", 404);

    const commands = await prisma.command.findMany({
      where: { terminalId: terminal.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonOk({ ok: true, commands });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { text?: string };
    if (!body.text?.trim()) return jsonError("text required");

    const text = normalizeCommandText(body.text);
    if (!isAllowedPhase1Command(text)) {
      return jsonError(
        "Command not allowed. Use /on /off /pause /reset /status /conservative /aggressive /oneway /twoway /setlayer /setmultiplier /settarget /setcutloss /maxlot /maxlayer /tradetime /tradestart /tradeend",
      );
    }

    const member = await getSessionMember();
    if (member) {
      await requireMember();
      const terminal = await getTerminalForMember(member, id);
      if (!terminal) return jsonError("Terminal not found", 404);
      if (!terminal.enabled) return jsonError("Terminal disabled", 400);

      const command = await prisma.command.create({
        data: {
          terminalId: terminal.id,
          text,
          actorMemberId: member.id,
        },
      });

      return jsonOk({ ok: true, command }, { status: 201 });
    }

    const user = await requireUser();
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
