"use client";

import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavMainItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
};

export type NavMainGroup = {
  label?: string;
  items: NavMainItem[];
};

export function NavMain({ groups }: { groups: NavMainGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label ?? group.items[0]?.title}>
          {group.label ? (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={item.isActive}
                    className={cn(
                      "h-10 gap-3 rounded-lg px-2.5",
                      item.isActive
                        ? "font-medium text-sidebar-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Link href={item.url}>
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary transition-colors [&_svg]:size-4",
                          item.isActive
                            ? "text-sidebar-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
