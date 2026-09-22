/** Asia/Jakarta (WIB, UTC+7). Indonesia has no DST. */
export const EXPIRY_TIME_ZONE = "Asia/Jakarta";
const WIB_OFFSET = "+07:00";

/** Preset durasi langganan untuk create akun. */
export const EXPIRY_DURATION_OPTIONS = [
  { months: 1, label: "1 bulan" },
  { months: 3, label: "3 bulan" },
  { months: 6, label: "6 bulan" },
  { months: 12, label: "12 bulan" },
  { months: 0, label: "Tanpa batas" },
] as const;

/** Today's date as YYYY-MM-DD in WIB. */
export function todayYmdWib(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: EXPIRY_TIME_ZONE });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  // month: 1-12, Date(year, month, 0) = last day of that month
  return new Date(year, month, 0).getDate();
}

/**
 * Add N calendar months to YYYY-MM-DD.
 * Same day-of-month when possible; otherwise clamp to last day
 * (e.g. 31 Jan + 1 mo → 28/29 Feb).
 */
export function addMonthsYmd(ymd: string, months: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error("addMonthsYmd expects YYYY-MM-DD");
  }
  if (!Number.isInteger(months)) {
    throw new Error("addMonthsYmd expects integer months");
  }
  const [y, m, d] = ymd.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return `${ny}-${pad2(nm)}-${pad2(nd)}`;
}

/** Resolve duration preset → YYYY-MM-DD or null (tanpa batas). */
export function expiryYmdFromDurationMonths(
  months: number,
  fromYmd = todayYmdWib(),
): string | null {
  if (months <= 0) return null;
  return addMonthsYmd(fromYmd, months);
}

/** Human label for YYYY-MM-DD in id-ID / WIB. */
export function formatExpiryYmdLabel(ymd: string | null): string {
  if (!ymd) return "Tanpa batas";
  const d = new Date(`${ymd}T12:00:00${WIB_OFFSET}`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: EXPIRY_TIME_ZONE,
  });
}

/** Parse dashboard expiry input. Empty / null → clear (no expiry). */
export function parseExpiresAt(
  value: unknown,
): { ok: true; date: Date | null } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") {
    return { ok: true, date: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "expiresAt must be a date string or null" };
  }
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, date: null };

  // date-only YYYY-MM-DD → end of that WIB day
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T23:59:59.999${WIB_OFFSET}`);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, error: "invalid expiresAt date" };
    }
    return { ok: true, date: d };
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "invalid expiresAt date" };
  }
  return { ok: true, date: d };
}

export function expiryStatus(expiresAt: Date | null | undefined): {
  label: "none" | "active" | "expiring" | "expired";
  expiresAt: string | null;
  expiresTs: number | null;
} {
  if (!expiresAt) {
    return { label: "none", expiresAt: null, expiresTs: null };
  }
  const ts = Math.floor(expiresAt.getTime() / 1000);
  const iso = expiresAt.toISOString();
  const msLeft = expiresAt.getTime() - Date.now();
  if (msLeft < 0) {
    return { label: "expired", expiresAt: iso, expiresTs: ts };
  }
  if (msLeft < 7 * 24 * 60 * 60 * 1000) {
    return { label: "expiring", expiresAt: iso, expiresTs: ts };
  }
  return { label: "active", expiresAt: iso, expiresTs: ts };
}

export function formatExpiryDate(expiresAt: Date | null | undefined): string {
  if (!expiresAt) return "Tanpa batas";
  return expiresAt.toLocaleDateString("en-CA", { timeZone: EXPIRY_TIME_ZONE });
}

/** Format Date/ISO as YYYY-MM-DD in WIB for <input type="date">. */
export function toExpiryDateInput(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: EXPIRY_TIME_ZONE });
}

if (process.env.NODE_ENV !== "production") {
  const a = addMonthsYmd("2026-07-24", 1);
  const b = addMonthsYmd("2026-01-31", 1);
  if (a !== "2026-08-24" || b !== "2026-02-28") {
    console.error("[expiry] addMonthsYmd self-check failed", { a, b });
  }
}
