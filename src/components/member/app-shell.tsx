"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { MemberBottomNav } from "@/components/member/bottom-nav";
import { SmhLogo } from "@/components/shared/smh-logo";
import { cn } from "@/lib/utils";

type Chrome = {
  title: string;
  subtitle?: string;
  tab: boolean;
  back?: string;
  showLogo?: boolean;
};

function resolveChrome(pathname: string): Chrome {
  if (pathname === "/member") {
    return { title: "Beranda", tab: true, showLogo: true };
  }
  if (pathname === "/member/account") {
    return {
      title: "Daftar Akun",
      tab: true,
    };
  }
  if (pathname.startsWith("/member/profile")) {
    return {
      title: "Profil",
      tab: true,
    };
  }
  if (/^\/member\/account\/[^/]+$/.test(pathname)) {
    return {
      title: "Detail Akun",
      back: "/member/account",
      tab: false,
    };
  }
  if (pathname.startsWith("/member/tools/simulasi")) {
    return {
      title: "Simulasi",
      subtitle: "Lot & Modal",
      back: "back",
      tab: false,
    };
  }
  return { title: "SMH", tab: true, showLogo: true };
}

export function MemberAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const chrome = resolveChrome(pathname);

  return (
    <div className="h-dvh overflow-hidden bg-muted/40">
      <div className="mx-auto flex h-dvh w-full max-w-107.5 flex-col overflow-hidden bg-background shadow-sm md:max-w-3xl md:border-x md:border-border">
        <header
          className={cn(
            "sticky top-0 z-20 shrink-0 border-b border-border bg-background/95 backdrop-blur-md",
            "pt-[env(safe-area-inset-top)]",
          )}
        >
          <div className="flex min-h-14 items-center gap-2.5 px-4 md:px-6">
            {chrome.back ? (
              chrome.back === "back" ? (
                <button
                  type="button"
                  aria-label="Kembali"
                  onClick={() => router.back()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card text-foreground transition-colors active:bg-accent/40"
                >
                  <ArrowLeftIcon className="size-4" />
                </button>
              ) : (
                <Link
                  href={chrome.back}
                  aria-label="Kembali"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card text-foreground transition-colors active:bg-accent/40"
                >
                  <ArrowLeftIcon className="size-4" />
                </Link>
              )
            ) : chrome.showLogo ? (
              <SmhLogo size={28} className="shrink-0" />
            ) : null}

            <div className="min-w-0 flex-1">
              <h1 className="type-ui truncate font-semibold leading-tight tracking-tight">
                {chrome.title}
              </h1>
              {chrome.subtitle ? (
                <p className="type-caption mt-0.5 truncate text-muted-foreground">
                  {chrome.subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden px-4 py-4 pb-5 md:px-6 md:py-5">
          {children}
        </main>

        {chrome.tab ? <MemberBottomNav /> : null}
      </div>
    </div>
  );
}
