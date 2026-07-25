import { CommandStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authenticateTerminal } from "@/lib/terminal-auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ terminalId: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { terminalId } = await params;
    const terminal = await authenticateTerminal(
      terminalId,
      req.headers.get("authorization"),
    );
    if (!terminal) return jsonError("Unauthorized", 401);

    const commands = await prisma.command.findMany({
      where: {
        terminalId: terminal.id,
        status: CommandStatus.PENDING,
      },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { id: true, text: true },
    });

    return jsonOk({
      ok: true,
      commands: commands.map((c) => ({ id: c.id, text: c.text })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
