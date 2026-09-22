/**
 * Allowlisted terminal API payloads - never return apiKey fields or rawJson by default.
 */

export const snapshotListSelect = {
  status: true,
  symbol: true,
  balance: true,
  equity: true,
  positions: true,
  floatPnl: true,
  dailyPnl: true,
  updatedAt: true,
} as const;

export const snapshotDetailSelect = {
  status: true,
  account: true,
  symbol: true,
  balance: true,
  equity: true,
  positions: true,
  buy: true,
  sell: true,
  floatPnl: true,
  dailyPnl: true,
  layer: true,
  multiplier: true,
  target: true,
  cutloss: true,
  mode: true,
  entryMode: true,
  maxLot: true,
  maxLayer: true,
  tradeTime: true,
  tradeStartMin: true,
  tradeEndMin: true,
  updatedAt: true,
} as const;

type SnapshotList = {
  status: string | null;
  symbol: string | null;
  balance: { toString(): string } | null;
  equity: { toString(): string } | null;
  positions: number | null;
  floatPnl: { toString(): string } | null;
  dailyPnl: { toString(): string } | null;
  updatedAt: Date;
};

type SnapshotDetail = SnapshotList & {
  account: bigint | null;
  buy: number | null;
  sell: number | null;
  layer: { toString(): string } | null;
  multiplier: { toString(): string } | null;
  target: { toString(): string } | null;
  cutloss: { toString(): string } | null;
  mode: number | null;
  entryMode: number | null;
  maxLot: { toString(): string } | null;
  maxLayer: number | null;
  tradeTime: boolean | null;
  tradeStartMin: number | null;
  tradeEndMin: number | null;
};

export function mapSnapshotList(s: SnapshotList | null | undefined) {
  if (!s) return null;
  return {
    status: s.status,
    symbol: s.symbol,
    balance: s.balance?.toString() ?? null,
    equity: s.equity?.toString() ?? null,
    positions: s.positions,
    floatPnl: s.floatPnl?.toString() ?? null,
    dailyPnl: s.dailyPnl?.toString() ?? null,
    updatedAt: s.updatedAt,
  };
}

export function mapSnapshotDetail(s: SnapshotDetail | null | undefined) {
  if (!s) return null;
  return {
    status: s.status,
    account: s.account?.toString() ?? null,
    symbol: s.symbol,
    balance: s.balance?.toString() ?? null,
    equity: s.equity?.toString() ?? null,
    positions: s.positions,
    buy: s.buy,
    sell: s.sell,
    floatPnl: s.floatPnl?.toString() ?? null,
    dailyPnl: s.dailyPnl?.toString() ?? null,
    layer: s.layer?.toString() ?? null,
    multiplier: s.multiplier?.toString() ?? null,
    target: s.target?.toString() ?? null,
    cutloss: s.cutloss?.toString() ?? null,
    mode: s.mode,
    entryMode: s.entryMode,
    maxLot: s.maxLot?.toString() ?? null,
    maxLayer: s.maxLayer,
    tradeTime: s.tradeTime,
    tradeStartMin: s.tradeStartMin,
    tradeEndMin: s.tradeEndMin,
    updatedAt: s.updatedAt,
  };
}

export type TerminalListOwner = {
  id: string;
  email: string;
  displayName: string | null;
} | null;

export function mapTerminalListItem(t: {
  id: string;
  terminalId: string;
  name: string;
  enabled: boolean;
  expiresAt: Date | null;
  lastSeenAt: Date | null;
  snapshot: SnapshotList | null;
  owner: TerminalListOwner;
}) {
  return {
    id: t.id,
    terminalId: t.terminalId,
    name: t.name,
    enabled: t.enabled,
    expiresAt: t.expiresAt?.toISOString() ?? null,
    lastSeenAt: t.lastSeenAt,
    owner: t.owner,
    snapshot: mapSnapshotList(t.snapshot),
  };
}
