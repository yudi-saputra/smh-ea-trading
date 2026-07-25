import { CommandStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authenticateTerminal } from "@/lib/terminal-auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ terminalId: string; commandId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { terminalId, commandId } = await params;
    const terminal = await authenticateTerminal(
      terminalId,
      req.headers.get("authorization"),
    );
    if (!terminal) return jsonError("Unauthorized", 401);

    const body = (await req.json()) as { ok?: boolean; message?: string };
    const command = await prisma.command.findFirst({
      where: { id: commandId, terminalId: terminal.id },
    });
    if (!command) return jsonError("Command not found", 404);

    const updated = await prisma.command.update({
      where: { id: command.id },
      data: {
        status: body.ok === false ? CommandStatus.FAILED : CommandStatus.ACKED,
        resultMessage: body.message ?? null,
        ackedAt: new Date(),
      },
    });

    return jsonOk({ ok: true, command: updated });
  } catch (err) {
    return handleRouteError(err);
  }
}
