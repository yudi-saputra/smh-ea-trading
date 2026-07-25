import { MemberStatus } from "@prisma/client";

export function formatMemberStatus(status: MemberStatus | string) {
  return status === MemberStatus.ACTIVE ? "Aktif" : "Non-Aktif";
}

export function parseMemberStatus(value: unknown): MemberStatus | null {
  if (value === MemberStatus.ACTIVE || value === MemberStatus.INACTIVE) {
    return value;
  }
  return null;
}
