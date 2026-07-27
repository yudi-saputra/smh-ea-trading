import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser, canListUsers } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UsersTable, type UserRow } from "@/components/admin/tables/users-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pengguna" };

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!canListUsers(user.role)) redirect("/admin");

  const isSuperAdmin = user.role === Role.SUPER_ADMIN;

  const users = await prisma.user.findMany({
    where: isSuperAdmin ? undefined : { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      displayName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    status: u.status,
    displayName: u.displayName,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <UsersTable
      header={
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Daftar Pengguna</h2>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin
              ? "Kelola akun Super Admin dan Staff."
              : "Profil akun Anda. Detail dan Edit tersedia; hapus akun tidak diizinkan."}
          </p>
        </div>
      }
      rows={rows}
      allowCreateAdmin={isSuperAdmin}
      canEdit
      allowRoleSelect={isSuperAdmin}
      canDeleteUsers={isSuperAdmin}
      currentUserId={user.id}
    />
  );
}
