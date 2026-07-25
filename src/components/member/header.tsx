"use client";

import { MemberBottomNav } from "@/components/member/bottom-nav";
import { SmhLogo } from "@/components/shared/smh-logo";

export function MemberHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-muted/40">
      {/* Locked to phone + tablet widths; desktop stays centered app frame */}
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background shadow-sm md:max-w-[768px] md:border-x md:border-border">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
          <SmhLogo size={32} />
          <div className="min-w-0 flex-1">
            <p className="type-ui truncate font-bold leading-tight tracking-tight">
              Smart Martingale Hedging
            </p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 py-4 pb-5 md:px-6 md:py-5">
          {children}
        </main>

        <MemberBottomNav />
      </div>
    </div>
  );
}
