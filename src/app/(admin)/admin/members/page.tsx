import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  MembersTable,
  type MemberPackageOption,
  type MemberRow,
} from "@/components/admin/tables/members-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Member" };

export default async function AdminMembersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== Role.SUPER_ADMIN) redirect("/admin");

  const [members, packages] = await Promise.all([
    prisma.member.findMany({
      select: {
        id: true,
        packageId: true,
        name: true,
        email: true,
        idTrading: true,
        passwordTrading: true,
        serverBroker: true,
        status: true,
        package: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.package.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows: MemberRow[] = members.map((m) => ({
    id: m.id,
    packageId: m.packageId,
    packageName: m.package.name,
    name: m.name,
    email: m.email,
    password: "••••••••",
    idTrading: m.idTrading,
    passwordTrading: m.passwordTrading,
    serverBroker: m.serverBroker,
    status: m.status,
  }));

  const packageOptions: MemberPackageOption[] = packages.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  return (
    <MembersTable
      header={
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Daftar Member</h2>
          <p className="text-sm text-muted-foreground">
            Kelola member dan detail trading.
          </p>
        </div>
      }
      rows={rows}
      packages={packageOptions}
    />
  );
}
