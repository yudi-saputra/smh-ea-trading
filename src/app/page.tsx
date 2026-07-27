import type { Metadata } from "next";
import Link from "next/link";
import { SmhLogo } from "@/components/shared/smh-logo";

export const metadata: Metadata = {
  title: "Coming Soon",
  description: "Smart Martingale Hedging — situs publik segera hadir.",
};

/** Public root — coming soon until marketing site ships. */
export default function PublicHomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklch,var(--trading-gold)_22%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2] [background-image:linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
      />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex w-full max-w-lg flex-col items-center gap-8">
          <div className="animate-in fade-in zoom-in-95 duration-700 fill-mode-both">
            <SmhLogo size={96} priority />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-4 duration-700 delay-150 fill-mode-both">
            <p className="font-mono text-xs font-medium tracking-[0.28em] text-trading-gold uppercase">
              Coming Soon
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Smart Martingale Hedging
            </h1>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              Situs publik sedang disiapkan. <br />
              Akses member tetap bisa di akses.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-wrap items-center justify-center gap-3 duration-700 delay-300 fill-mode-both">
            <Link
              href="/member/login"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Masuk Member
            </Link>
            <Link
              href="/member/register"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background/80 px-5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-muted"
            >
              Daftar
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 animate-in fade-in pb-8 text-center duration-1000 delay-500 fill-mode-both">
        <p className="text-xs text-muted-foreground">
          Copyright © {new Date().getFullYear()} SMH Control Panel. All
          rights reserved.
        </p>
      </footer>
    </div>
  );
}
