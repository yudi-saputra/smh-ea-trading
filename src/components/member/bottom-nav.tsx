"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, MonitorSmartphoneIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/member",
    label: "Home",
    icon: HomeIcon,
    match: (p: string) => p === "/member",
  },
  {
    href: "/member/account",
    label: "Account",
    icon: MonitorSmartphoneIcon,
    match: (p: string) => p.startsWith("/member/account"),
  },
  {
    href: "/member/profile",
    label: "Profile",
    icon: UserIcon,
    match: (p: string) => p.startsWith("/member/profile"),
  },
] as const;

export function MemberBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="z-20 shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid h-16 max-w-[430px] grid-cols-3 md:max-w-none">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "type-caption flex h-full flex-col items-center justify-center gap-0.5 font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", active && "stroke-[2.25px]")}
                  aria-hidden
                />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
