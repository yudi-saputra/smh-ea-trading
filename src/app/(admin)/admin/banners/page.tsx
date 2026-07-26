import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { AdminBannerManager } from "@/components/admin/banners/banner-manager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Banner" };

export default async function AdminBannersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== Role.SUPER_ADMIN) redirect("/admin");

  return (
    <AdminBannerManager
      header={
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Banner</h2>
          <p className="text-sm text-muted-foreground">
            Kelola slide banner di beranda member.
          </p>
        </div>
      }
    />
  );
}
