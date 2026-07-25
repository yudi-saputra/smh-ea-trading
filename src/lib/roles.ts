import { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  STAFF: "Staff",
  TRADER: "Trader",
};

export function formatRoleLabel(role: string) {
  return ROLE_LABELS[role as Role] ?? role;
}
