"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/admin/layout/nav-main";
import { NavUser } from "@/components/admin/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  MonitorSmartphoneIcon,
  UsersIcon,
  ImageIcon,
  PackageIcon,
  UserRoundIcon,
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
  const showTerminals = user.role === "SUPER_ADMIN";
  const showUsers = user.role === "SUPER_ADMIN" || user.role === "STAFF";
  const homeHref = showTerminals ? "/admin" : "/admin/users";

  const platformItems = showTerminals
    ? [
        {
          title: "Dashboard",
          url: "/admin",
          icon: <LayoutDashboardIcon />,
          isActive:
            pathname === "/admin" || pathname.startsWith("/admin/dashboard"),
        },
        {
          title: "Account EA",
          url: "/admin/account",
          icon: <MonitorSmartphoneIcon />,
          isActive: pathname.startsWith("/admin/account"),
        },
        {
          title: "Member",
          url: "/admin/members",
          icon: <UserRoundIcon />,
          isActive: pathname.startsWith("/admin/members"),
        },
      ]
    : [];

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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href={homeHref}>
                <SmhLogo size={40} />
                <span className="text-base font-semibold">SMH Control Panel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>

      <SidebarFooter>
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
