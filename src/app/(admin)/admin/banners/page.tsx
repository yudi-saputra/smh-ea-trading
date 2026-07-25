import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { AdminBannerManager } from "@/components/admin/banners/banner-manager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Banner Home" };

export default async function AdminBannersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== Role.SUPER_ADMIN) redirect("/admin");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Banner Home</h1>
        <p className="text-sm text-muted-foreground">
          Upload gambar JPG atau PNG landscape untuk slide banner di halaman Home
          client.
        </p>
      </div>
      <AdminBannerManager />
    </div>
  );
}
