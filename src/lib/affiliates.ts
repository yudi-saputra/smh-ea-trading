import { AffiliateStatus } from "@prisma/client";

/** Normalize referral code for storage / lookup. */
export function normalizeAffiliateCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** [A-Z0-9_-] length 2–32 after normalize. */
export const AFFILIATE_CODE_RE = /^[A-Z0-9_-]{2,32}$/;

export function parseAffiliateStatus(value: unknown): AffiliateStatus | null {
  if (value === AffiliateStatus.ACTIVE || value === "ACTIVE") {
    return AffiliateStatus.ACTIVE;
  }
  if (value === AffiliateStatus.INACTIVE || value === "INACTIVE") {
    return AffiliateStatus.INACTIVE;
  }
  return null;
}

export function formatAffiliateStatus(status: string) {
  return status === AffiliateStatus.ACTIVE ? "Aktif" : "Nonaktif";
}
