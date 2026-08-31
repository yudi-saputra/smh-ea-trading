/** Cross-page optimistic EA power until heartbeat snapshot catches up. */
const KEY = (terminalId: string) => `smh:ea-power:${terminalId}`;

export function setEaPowerPending(terminalId: string, on: boolean) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY(terminalId), on ? "1" : "0");
    window.dispatchEvent(new Event("smh:ea-power"));
  } catch {
    // sessionStorage blocked
  }
}

export function clearEaPowerPending(terminalId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY(terminalId));
    window.dispatchEvent(new Event("smh:ea-power"));
  } catch {
    // ignore
  }
}

export function readEaPowerPending(terminalId: string): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(KEY(terminalId));
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    // ignore
  }
  return null;
}
