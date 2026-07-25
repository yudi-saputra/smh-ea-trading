import { prisma } from "@/lib/db";
import { authenticateTerminal } from "@/lib/terminal-auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ terminalId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { terminalId } = await params;
    const terminal = await authenticateTerminal(
      terminalId,
      req.headers.get("authorization"),
    );
    if (!terminal) return jsonError("Unauthorized", 401);

    const body = (await req.json()) as Record<string, unknown>;
    const status =
      typeof body.status === "string" ? body.status.toLowerCase() : "off";

    const num = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? v : null;
    const int = (v: unknown) => {
      const n = num(v);
      return n === null ? null : Math.trunc(n);
    };
    const boolish = (v: unknown): boolean | null => {
      if (v === true || v === 1 || v === "1" || v === "on") return true;
      if (v === false || v === 0 || v === "0" || v === "off") return false;
      return null;
    };
    const tradeTime = boolish(body.trade_time);
    const tradeStartMin = int(body.trade_start);
    const tradeEndMin = int(body.trade_end);

    await prisma.$transaction([
      prisma.terminal.update({
        where: { id: terminal.id },
        data: { lastSeenAt: new Date() },
      }),
      prisma.terminalSnapshot.upsert({
        where: { terminalId: terminal.id },
        create: {
          terminalId: terminal.id,
          status,
          account: body.account != null ? BigInt(Number(body.account)) : null,
          symbol: typeof body.symbol === "string" ? body.symbol : null,
          balance: num(body.balance),
          equity: num(body.equity),
          positions: int(body.positions) ?? 0,
          buy: int(body.buy) ?? 0,
          sell: int(body.sell) ?? 0,
          floatPnl: num(body.float_pnl),
          dailyPnl: num(body.daily_pnl),
          layer: num(body.layer),
          multiplier: num(body.multiplier),
          target: num(body.target),
          cutloss: num(body.cutloss),
          mode: int(body.mode),
          entryMode: int(body.entry_mode),
          maxLot: num(body.max_lot),
          maxLayer: int(body.max_layer),
          tradeTime,
          tradeStartMin,
          tradeEndMin,
          rawJson: body as object,
        },
        update: {
          status,
          account: body.account != null ? BigInt(Number(body.account)) : null,
          symbol: typeof body.symbol === "string" ? body.symbol : null,
          balance: num(body.balance),
          equity: num(body.equity),
          positions: int(body.positions) ?? 0,
          buy: int(body.buy) ?? 0,
          sell: int(body.sell) ?? 0,
          floatPnl: num(body.float_pnl),
          dailyPnl: num(body.daily_pnl),
          layer: num(body.layer),
          multiplier: num(body.multiplier),
          target: num(body.target),
          cutloss: num(body.cutloss),
          mode: int(body.mode),
          entryMode: int(body.entry_mode),
          maxLot: num(body.max_lot),
          maxLayer: int(body.max_layer),
          tradeTime,
          tradeStartMin,
          tradeEndMin,
          rawJson: body as object,
        },
      }),
    ]);

    return jsonOk({
      ok: true,
      expires_at: terminal.expiresAt?.toISOString() ?? null,
      expires_ts: terminal.expiresAt
        ? Math.floor(terminal.expiresAt.getTime() / 1000)
        : 0,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
