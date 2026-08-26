import {
  AppWindow,
  CalculatorIcon,
  CandlestickChart,
  HomeIcon,
  Layers,
  MonitorSmartphoneIcon,
  PowerIcon,
  ScrollTextIcon,
  SettingsIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";
import { SmhLogo } from "@/components/shared/smh-logo";
import { cn } from "@/lib/utils";

/** Static marketing mockup of the member control panel — not live data. */
export function HeroPhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[250px] max-sm:-mb-8 sm:max-w-95 md:max-w-100">
      <div
        className="relative origin-top scale-[0.86] pt-7 sm:scale-100 sm:pt-12"
        aria-hidden
      >
        {/* Soft circular glow behind phone */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-[120%] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--trading-gold)_28%,transparent)_0%,color-mix(in_oklch,var(--trading-gold)_10%,transparent)_42%,transparent_70%)] blur-2xl sm:size-[130%]" />

        {/* Floating feature cards */}
        <FloatCard
          className="absolute left-0 top-5 z-10 -translate-x-0.5 sm:top-3 sm:-translate-x-4 md:-translate-x-8"
          floatClass="hero-float"
          icon={CandlestickChart}
          title="Symbol"
          subtitle="XAUUSD"
        />
        <FloatCard
          className="absolute right-0 top-[34%] z-10 translate-x-0.5 sm:top-[36%] sm:translate-x-4 md:translate-x-8"
          floatClass="hero-float hero-float-delay-1"
          icon={Layers}
          title="Mode"
          subtitle="Dual Mode Strategy"
        />
        <FloatCard
          className="absolute bottom-[16%] left-0 z-10 -translate-x-0.5 sm:bottom-[18%] sm:-translate-x-6 md:-translate-x-10"
          floatClass="hero-float hero-float-delay-2"
          icon={AppWindow}
          title="Kontrol"
          subtitle="Panel Web & On-Chart"
        />

        {/* Phone bezel — portrait proportions */}
        <div className="relative z-1 mx-auto w-[82%] max-w-[210px] sm:w-[76%] sm:max-w-75 md:max-w-77.5">
          <div className="rounded-[1.5rem] border border-zinc-700/80 bg-zinc-950 p-1 shadow-[0_20px_48px_-18px_rgba(0,0,0,0.5)] ring-1 ring-white/5 sm:rounded-[2rem] sm:p-2 sm:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
            <div className="overflow-hidden rounded-[1.2rem] bg-[#0c0c0e] sm:rounded-[1.5rem]">
              {/* Status bar */}
              <div className="flex items-center justify-between px-4 pb-0.5 pt-2 sm:px-5 sm:pb-1 sm:pt-3">
                <span className="mx-auto h-1 w-12 rounded-full bg-zinc-800 sm:h-1.5 sm:w-16" />
              </div>

              {/* App header */}
              <div className="flex items-center gap-1.5 border-b border-zinc-800/80 px-2.5 py-1.5 sm:gap-2 sm:px-3.5 sm:py-2.5">
                <SmhLogo size={18} className="sm:hidden" />
                <SmhLogo size={22} className="hidden sm:block" />
                <p className="truncate text-[10px] font-bold tracking-tight text-zinc-100 sm:text-[11px]">
                  Strategic Market Handler
                </p>
              </div>

              {/* Screen content — mirrors member account panel */}
              <div className="space-y-1.5 px-2 py-1.5 sm:space-y-2 sm:px-2.5 sm:py-2.5">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-zinc-100 sm:text-[11px]">
                      EA Power
                    </p>
                    <p className="mt-0.5 text-[8px] text-zinc-500 sm:text-[9px]">
                      Perintah ON / OFF ke EA
                    </p>
                  </div>
                  <div className="relative flex h-7 w-14 shrink-0 items-center justify-end rounded-full border border-emerald-500/40 bg-emerald-500/15 p-0.5 sm:h-8 sm:w-16">
                    <span className="absolute left-1.5 text-[7px] font-bold tracking-wide text-emerald-400 sm:left-2 sm:text-[8px]">
                      ON
                    </span>
                    <span className="flex size-5 items-center justify-center rounded-full bg-zinc-950 text-emerald-400 shadow-sm sm:size-6">
                      <PowerIcon className="size-2.5 sm:size-3" />
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80 sm:rounded-xl">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 px-2 py-1.5 sm:px-2.5 sm:py-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-zinc-100 sm:text-[11px]">
                        Kontrol
                      </p>
                      <p className="mt-0.5 text-[8px] leading-snug text-zinc-500 sm:text-[8.5px]">
                        Pause, reset, arah entry, dan mode
                      </p>
                    </div>
                    <span className="inline-flex h-[18px] shrink-0 items-center gap-0.5 rounded-md border border-zinc-700 px-1 text-[7px] font-semibold text-zinc-300 sm:h-5 sm:gap-1 sm:px-1.5 sm:text-[8px]">
                      <ScrollTextIcon className="size-2 sm:size-2.5" />
                      Logs
                    </span>
                  </div>
                  <div className="space-y-0.5 p-1.5 sm:space-y-1 sm:p-2">
                    <MockBtn>PAUSE ENTRY</MockBtn>
                    <MockBtn tone="reset">RESET TARGET</MockBtn>
                    <div className="grid grid-cols-2 gap-0.5 sm:gap-1">
                      <MockBtn active>2 ARAH</MockBtn>
                      <MockBtn>1 ARAH</MockBtn>
                    </div>
                    <MockBtn active>CONSERVATIVE</MockBtn>
                    <MockBtn>AGGRESSIVE</MockBtn>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80 sm:rounded-xl">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 px-2 py-1.5 sm:px-2.5 sm:py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <p className="text-[10px] font-semibold text-zinc-100 sm:text-[11px]">
                        Detail Account
                      </p>
                    </div>
                    <div className="flex gap-0.5 sm:gap-1">
                      <span className="inline-flex h-[18px] items-center gap-0.5 rounded-md border border-zinc-700 px-1 text-[7px] font-semibold text-zinc-300 sm:h-5 sm:gap-1 sm:px-1.5 sm:text-[8px]">
                        <CalculatorIcon className="size-2 sm:size-2.5" />
                        Simulasi
                      </span>
                      <span className="inline-flex h-[18px] items-center gap-0.5 rounded-md border border-zinc-700 px-1 text-[7px] font-semibold text-zinc-300 sm:h-5 sm:gap-1 sm:px-1.5 sm:text-[8px]">
                        <SettingsIcon className="size-2 sm:size-2.5" />
                        Setting
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-zinc-800/40">
                    <MockStat label="Float" value="-82.40" tone="loss" />
                    <MockStat label="Daily" value="124.50" tone="profit" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-zinc-800/80 pb-1.5 pt-1 sm:pb-2.5 sm:pt-1.5">
                <NavItem icon={HomeIcon} label="Home" />
                <NavItem icon={MonitorSmartphoneIcon} label="Account" active />
                <NavItem icon={UserIcon} label="Profile" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockBtn({
  children,
  active,
  tone,
}: {
  children: React.ReactNode;
  active?: boolean;
  tone?: "muted" | "reset";
}) {
  return (
    <div
      className={
        active
          ? "flex h-6 items-center justify-center rounded-md bg-emerald-800 text-[8px] font-semibold tracking-wide text-white sm:h-7 sm:text-[9px]"
          : tone === "reset"
            ? "flex h-6 items-center justify-center rounded-md border border-red-500/50 bg-red-600 text-[8px] font-semibold tracking-wide text-white sm:h-7 sm:text-[9px]"
            : tone === "muted"
              ? "flex h-6 items-center justify-center rounded-md border border-zinc-700/60 bg-zinc-800/40 text-[8px] font-semibold tracking-wide text-zinc-400 sm:h-7 sm:text-[9px]"
              : "flex h-6 items-center justify-center rounded-md border border-zinc-700/80 bg-zinc-800/70 text-[8px] font-semibold tracking-wide text-zinc-300 sm:h-7 sm:text-[9px]"
      }
    >
      {children}
    </div>
  );
}

function FloatCard({
  icon: Icon,
  title,
  subtitle,
  className,
  floatClass,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  className?: string;
  floatClass?: string;
}) {
  return (
    <div className={cn("absolute z-10", className)}>
      <div
        className={cn(
          "flex max-w-36 items-center gap-1.5 rounded-xl border border-border/50 bg-card/80 px-2 py-1.5 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.35)] backdrop-blur-md sm:max-w-52 sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-3",
          floatClass,
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-trading-gold/12 sm:size-10 sm:rounded-xl">
          <Icon
            className="size-3 text-trading-gold sm:size-4.5"
            strokeWidth={2}
          />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold leading-tight text-foreground sm:text-[13px]">
            {title}
          </p>
          <p className="mt-0.5 truncate text-[8px] leading-snug text-muted-foreground sm:text-[11px]">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function MockStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="bg-[#0c0c0e] px-2 py-1.5 text-center sm:py-2.5">
      <p className="text-[7px] font-medium uppercase tracking-[0.12em] text-zinc-500 sm:text-[8px]">
        {label}
      </p>
      <p
        className={
          tone === "profit"
            ? "mt-0.5 text-[10px] font-semibold tabular-nums text-emerald-400 sm:text-[11px]"
            : tone === "loss"
              ? "mt-0.5 text-[10px] font-semibold tabular-nums text-red-400 sm:text-[11px]"
              : "mt-0.5 text-[10px] font-semibold tabular-nums text-zinc-100 sm:text-[11px]"
        }
      >
        {value}
      </p>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof HomeIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={
        active
          ? "flex flex-col items-center gap-0.5 text-zinc-100"
          : "flex flex-col items-center gap-0.5 text-zinc-500"
      }
    >
      <Icon className="size-3 sm:size-3.5" strokeWidth={active ? 2.25 : 1.75} />
      <span className="text-[7px] font-medium sm:text-[8px]">{label}</span>
    </div>
  );
}
