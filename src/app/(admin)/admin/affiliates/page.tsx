import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  AffiliatesTable,
  type AffiliateRow,
} from "@/components/admin/tables/affiliates-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Afiliator" };

export default async function AdminAffiliatesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== Role.SUPER_ADMIN) redirect("/admin");

  const affiliates = await prisma.affiliate.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      notes: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows: AffiliateRow[] = affiliates.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    email: a.email,
    phone: a.phone,
    status: a.status,
    notes: a.notes,
    memberCount: a._count.members,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <AffiliatesTable
      header={
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Afiliator</h2>
          <p className="text-sm text-muted-foreground">
            Kelola kode referral. Member yang daftar dengan kode akan terhubung
            ke afiliator.
          </p>
        </div>
      }
      rows={rows}
    />
  );
}
