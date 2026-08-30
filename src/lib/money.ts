/** Shown when the EA has not reported a value yet — never render 0 for that. */
export const NO_DATA = "-";

/** Trading amounts always carry 2 decimals so columns line up. */
export function formatMoney(value: string | number | null | undefined): string {
  if (value == null || value === "") return NO_DATA;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return NO_DATA;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Profit/loss figures: explicit sign so gain vs loss reads at a glance. */
export function formatMoneySigned(
  value: string | number | null | undefined,
): string {
  const text = formatMoney(value);
  if (text === NO_DATA) return text;
  const n = typeof value === "number" ? value : Number(value);
  return n > 0 ? `+${text}` : text;
}

if (process.env.NODE_ENV !== "production") {
  // 0 is a real balance; missing data is not.
  const checks: [string, string][] = [
    [formatMoney(0), "0.00"],
    [formatMoney(null), NO_DATA],
    [formatMoney(""), NO_DATA],
    [formatMoney("5000366.9"), "5,000,366.90"],
    [formatMoneySigned(3449.77), "+3,449.77"],
    [formatMoneySigned(-82.4), "-82.40"],
    [formatMoneySigned(0), "0.00"],
    [formatMoneySigned(undefined), NO_DATA],
  ];
  for (const [got, want] of checks) {
    if (got !== want) {
      console.error("[money] self-check failed", { got, want });
    }
  }
}
