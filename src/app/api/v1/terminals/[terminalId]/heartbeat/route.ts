import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authenticateTerminal } from "@/lib/terminal-auth";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";

type Params = { params: Promise<{ terminalId: string }> };

const HEARTBEAT_MAX_BYTES = 64 * 1024;
const RAW_JSON_MAX_CHARS = 16_384;

const HEARTBEAT_KEYS = [
  "status",
  "account",
  "symbol",
  "balance",
  "equity",
  "positions",
  "buy",
  "sell",
  "float_pnl",
  "daily_pnl",
  "layer",
  "multiplier",
  "target",
  "cutloss",
  "mode",
  "entry_mode",
  "max_lot",
  "max_layer",
  "base_lot",
  "layers_per_lot",
  "lot_increment",
  "trade_time",
  "trade_start",
  "trade_end",
] as const;

function num(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function int(v: unknown) {
  const n = num(v);
  return n === null ? null : Math.trunc(n);
}

function boolish(v: unknown): boolean | null {
  if (v === true || v === 1 || v === "1" || v === "on") return true;
  if (v === false || v === 0 || v === "0" || v === "off") return false;
  return null;
}

/** Prefer string digits so account numbers beyond Number.MAX_SAFE_INTEGER stay exact. */
function parseAccount(v: unknown): bigint | null {
  if (v == null) return null;
  if (typeof v === "bigint") return v;
  if (typeof v === "number" && Number.isFinite(v)) {
    return BigInt(Math.trunc(v));
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (/^-?\d+$/.test(s)) return BigInt(s);
  }
  return null;
}

function pickRawJson(body: Record<string, unknown>) {
  const raw: Record<string, unknown> = {};
  for (const key of HEARTBEAT_KEYS) {
    if (key in body) raw[key] = body[key];
  }
  const s = JSON.stringify(raw);
  if (s.length > RAW_JSON_MAX_CHARS) {
    return { ok: false as const, error: "rawJson too large" };
  }
  return { ok: true as const, value: raw };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { terminalId } = await params;
    const terminal = await authenticateTerminal(
      terminalId,
      req.headers.get("authorization"),
    );
    if (!terminal) return jsonError("Unauthorized", 401);

    const parsed = await parseJsonBody(req, HEARTBEAT_MAX_BYTES);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const status =
      typeof body.status === "string" ? body.status.toLowerCase() : "off";
    const tradeTime = boolish(body.trade_time);
    const tradeStartMin = int(body.trade_start);
    const tradeEndMin = int(body.trade_end);
    const account = parseAccount(body.account);
    const rawPicked = pickRawJson(body);
    if (!rawPicked.ok) return jsonError(rawPicked.error, 413);

    const snapshotData = {
      status,
      account,
      symbol: typeof body.symbol === "string" ? body.symbol.slice(0, 64) : null,
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
      rawJson: rawPicked.value as Prisma.InputJsonValue,
    };

    await prisma.$transaction([
      prisma.terminal.update({
        where: { id: terminal.id },
        data: { lastSeenAt: new Date() },
      }),
      prisma.terminalSnapshot.upsert({
        where: { terminalId: terminal.id },
        create: {
          terminalId: terminal.id,
          ...snapshotData,
        },
        update: snapshotData,
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
