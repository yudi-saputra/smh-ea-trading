/** Controller considered online if heartbeat within this window. */
export const TERMINAL_ONLINE_MS = 30_000;

export function isTerminalOnline(lastSeenAt: Date | null | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - lastSeenAt.getTime() < TERMINAL_ONLINE_MS;
}

/**
 * Snapshot EA status lags when Controller/EA is offline.
 * Prefer live connectivity over stale "on" from last heartbeat.
 */
export function liveEaStatus(
  online: boolean,
  status: string | null | undefined,
) {
  if (!online) return "offline";
  const s = status?.trim();
  return s && s.length > 0 ? s : "—";
}

/** Forex typically closed Sat-Sun (WIB / Asia/Jakarta). */
export function isForexWeekendClosed(now = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(now);
  return weekday === "Sat" || weekday === "Sun";
}
