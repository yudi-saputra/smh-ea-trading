import { PackageStatus } from "@prisma/client";

export function formatPackageStatus(status: PackageStatus | string) {
  return status === PackageStatus.ACTIVE ? "Aktif" : "Non-Aktif";
}

export function parsePackageStatus(value: unknown): PackageStatus | null {
  if (value === PackageStatus.ACTIVE || value === PackageStatus.INACTIVE) {
    return value;
  }
  return null;
}
