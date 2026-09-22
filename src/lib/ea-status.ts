/** Tailwind tokens per EA state, so every member surface tints the same way. */
function eaTone(status: string) {
  if (status === "online") {
    return {
      pill: "text-trading-profit bg-trading-profit/10",
      text: "text-trading-profit",
      tile: "bg-trading-profit/10",
      dot: "bg-trading-profit",
    };
  }
  if (status === "paused") {
    return {
      pill: "text-trading-gold bg-trading-gold/10",
      text: "text-trading-gold",
      tile: "bg-trading-gold/10",
      dot: "bg-trading-gold",
    };
  }
  if (status === "offline" || status === "expired") {
    return {
      pill: "text-trading-loss bg-trading-loss/10",
      text: "text-trading-loss",
      tile: "bg-trading-loss/10",
      dot: "bg-trading-loss",
    };
  }
  return {
    pill: "text-muted-foreground bg-muted",
    text: "text-muted-foreground",
    tile: "bg-muted",
    dot: "bg-muted-foreground/50",
  };
}

export type MemberEaState = "online" | "paused" | "offline" | "expired";

/**
 * The one EA state every member surface renders. Expiry blocks trading, and a
 * stale snapshot can't outrank being offline - hence this order.
 */
export function memberEaStatus(
  online: boolean,
  status?: string | null,
  expired = false,
) {
  const s = status?.trim().toLowerCase();
  const label: MemberEaState = expired
    ? "expired"
    : !online
      ? "offline"
      : s === "paused"
        ? "paused"
        : s === "on"
          ? "online"
          : "offline";

  return { label, ...eaTone(label) };
}

/** Paused EA is still powered on - the switch reflects power, not entry. */
export function isEaPowered(state: MemberEaState) {
  return state === "online" || state === "paused";
}

if (process.env.NODE_ENV !== "production") {
  // Offline outranks a stale "on"; expiry outranks everything.
  const checks: [MemberEaState, MemberEaState][] = [
    [memberEaStatus(true, "on").label, "online"],
    [memberEaStatus(true, "off").label, "offline"],
    [memberEaStatus(true, "paused").label, "paused"],
    [memberEaStatus(false, "on").label, "offline"],
    [memberEaStatus(true, "on", true).label, "expired"],
    [memberEaStatus(false, "paused", true).label, "expired"],
  ];
  for (const [got, want] of checks) {
    if (got !== want) console.error("[ea-status] self-check failed", { got, want });
  }
  if (!isEaPowered("paused") || isEaPowered("offline")) {
    console.error("[ea-status] isEaPowered self-check failed");
  }
  if (isEaPowered(memberEaStatus(true, "off").label)) {
    console.error("[ea-status] off must not read as powered");
  }
}
