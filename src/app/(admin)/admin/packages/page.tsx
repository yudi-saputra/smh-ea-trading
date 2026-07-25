import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PackagesTable, type PackageRow } from "@/components/admin/tables/packages-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Package" };

export default async function AdminPackagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== Role.SUPER_ADMIN) redirect("/admin");

  const packages = await prisma.package.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });

  const rows: PackageRow[] = packages.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
  }));

  return (
    <PackagesTable
      header={
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Package</h2>
          <p className="text-sm text-muted-foreground">
            Kelola daftar package yang tersedia untuk trader.
          </p>
        </div>
      }
      rows={rows}
    />
  );
}
