/** Broker/MT password length bounds (recoverable secret, not portal hash). */
export const PASSWORD_TRADING_MIN = 4;
export const PASSWORD_TRADING_MAX = 128;

export function parsePasswordTrading(
  value: string | null | undefined,
): { ok: true; value: string } | { ok: false; error: string } {
  const v = value?.trim() ?? "";
  if (!v) return { ok: false, error: "Password Trading wajib diisi" };
  if (v.length < PASSWORD_TRADING_MIN) {
    return {
      ok: false,
      error: `Password Trading minimal ${PASSWORD_TRADING_MIN} karakter`,
    };
  }
  if (v.length > PASSWORD_TRADING_MAX) {
    return {
      ok: false,
      error: `Password Trading maksimal ${PASSWORD_TRADING_MAX} karakter`,
    };
  }
  return { ok: true, value: v };
}
