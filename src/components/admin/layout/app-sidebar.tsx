"use client";

import { usePathname } from "next/navigation";
import { NavMain } from "@/components/admin/layout/nav-main";
import { NavUser } from "@/components/admin/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  MonitorSmartphoneIcon,
  UsersIcon,
  ImageIcon,
  PackageIcon,
  UserRoundIcon,
  HandshakeIcon,
} from "lucide-react";
import { SmhLogo } from "@/components/shared/smh-logo";

export type SidebarUser = {
  id: string;
  email: string;
  role: string;
  displayName: string | null;
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isStaff = user.role === "STAFF";
  const showTerminals = isSuperAdmin;
  const showAccounts = isSuperAdmin || isStaff;
  const showUsers = isSuperAdmin || isStaff;

  const platformItems = [
    ...(showTerminals
      ? [
          {
            title: "Dashboard",
            url: "/admin",
            icon: <LayoutDashboardIcon />,
            isActive:
              pathname === "/admin" || pathname.startsWith("/admin/dashboard"),
          },
        ]
      : []),
    ...(showAccounts
      ? [
          {
            title: "Daftar Akun EA",
            url: "/admin/account",
            icon: <MonitorSmartphoneIcon />,
            isActive: pathname.startsWith("/admin/account"),
          },
        ]
      : []),
    ...(showTerminals
      ? [
          {
            title: "DaftarMember",
            url: "/admin/members",
            icon: <UserRoundIcon />,
            isActive: pathname.startsWith("/admin/members"),
          },
        ]
      : []),
  ];

  const contentItems = showTerminals
    ? [
        {
          title: "Banner",
          url: "/admin/banners",
          icon: <ImageIcon />,
          isActive: pathname.startsWith("/admin/banners"),
        },
        {
          title: "Paket",
          url: "/admin/packages",
          icon: <PackageIcon />,
          isActive: pathname.startsWith("/admin/packages"),
        },
        {
          title: "Afiliator",
          url: "/admin/affiliates",
          icon: <HandshakeIcon />,
          isActive: pathname.startsWith("/admin/affiliates"),
        },
      ]
    : [];

  const systemItems = showUsers
    ? [
        {
          title: "Pengguna",
          url: "/admin/users",
          icon: <UsersIcon />,
          isActive: pathname.startsWith("/admin/users"),
        },
      ]
    : [];

  const groups = [
    ...(platformItems.length ? [{ items: platformItems }] : []),
    ...(contentItems.length
      ? [{ label: "Main Menu", items: contentItems }]
      : []),
    ...(systemItems.length ? [{ label: "Sistem", items: systemItems }] : []),
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="flex h-12 items-center gap-2.5 overflow-visible px-2 py-1.5">
          <SmhLogo size={32} className="size-8 object-contain" />
          <span className="truncate text-base font-semibold leading-none">
            Strategic Market Handler
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mx-0" />
        <NavUser
          user={{
            name: user.displayName ?? user.email,
            email: user.email,
            role: user.role,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
