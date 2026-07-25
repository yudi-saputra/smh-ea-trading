"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/account": "Daftar Akun",
  "/admin/banners": "Banner",
  "/admin/packages": "Paket",
  "/admin/members": "Member",
  "/admin/users": "Pengguna",
};

function titleForPath(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.match(/^\/admin\/account\/[^/]+$/)) return "Detail akun";
  if (pathname.startsWith("/admin/account/")) return "Daftar Akun";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/banners")) return "Banner Home";
  if (pathname.startsWith("/admin/packages")) return "Package";
  if (pathname.startsWith("/admin/members")) return "Member";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "Overview";
  return "SMH";
}

export function SiteHeader() {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex h-full w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 data-vertical:h-4 data-vertical:self-center!"
        />
        <h1 className="text-base leading-none font-medium">{title}</h1>
        <div className="ml-auto flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
