import Image from "next/image";
import { SmhLogo } from "@/components/shared/smh-logo";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  balance: string;
  pnl: string;
  pnlValue: number | null;
  growthPct: number | null;
  className?: string;
};

function formatGrowth(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const arrow = value > 0 ? " ↑" : value < 0 ? " ↓" : "";
  return `${abs}%${arrow}`;
}

export function BalanceCard({
  name,
  balance,
  pnl,
  pnlValue,
  growthPct,
  className,
}: Props) {
  const growthTone =
    growthPct == null || growthPct === 0 || Number.isNaN(growthPct)
      ? "text-white"
      : growthPct > 0
        ? "text-trading-profit"
        : "text-trading-loss";

  const pnlTone =
    pnlValue == null || pnlValue === 0 || Number.isNaN(pnlValue)
      ? "text-white"
      : pnlValue > 0
        ? "text-trading-profit"
        : "text-trading-loss";

  // ponytail: flat/null → up mascot; only negative growth flips to down
  const mascotSrc =
    growthPct != null && !Number.isNaN(growthPct) && growthPct < 0
      ? "/maskot_smh_02.png"
      : "/maskot_smh_01.png";

  return (
    <div
      className={cn(
        "relative z-0 overflow-hidden rounded-2xl p-5 text-zinc-50 shadow-[0_6px_18px_-10px_rgba(0,0,0,0.55)] ring-1 ring-white/12",
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#141210] via-[#1c1814] to-[#0c0b0a]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-orange-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 left-0 size-36 rounded-full bg-amber-600/10 blur-2xl"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute right-0 top-0 z-0 h-[72%] w-[40%] min-w-[7rem] max-w-[10rem] sm:inset-y-0 sm:h-auto sm:w-[38%] sm:max-w-[13rem]"
        aria-hidden
      >
        <Image
          src={mascotSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 40vw, 208px"
          className="object-contain object-right-top sm:object-right"
          priority={false}
        />
      </div>

      <div className="relative z-10">
        <div className="max-w-[58%] sm:max-w-[65%]">
          <div className="flex items-center gap-2.5">
            <SmhLogo size={32} />
            <p className="type-ui truncate font-semibold tracking-tight text-white">
              {name}
            </p>
          </div>

          <p
            className={cn(
              "mt-3 text-4xl font-semibold tabular-nums tracking-tight sm:mt-5 sm:text-5xl",
              growthTone,
            )}
          >
            {formatGrowth(growthPct)}
          </p>
        </div>

        <div className="mt-3 grid max-w-[88%] grid-cols-2 gap-x-6 gap-y-1 sm:mt-6 sm:max-w-[72%] sm:gap-x-10">
          <div className="min-w-0">
            <p className="type-caption text-zinc-500">Total Balance</p>
            <p className="mt-1 truncate text-base font-semibold tabular-nums text-white sm:text-lg">
              {balance}
            </p>
          </div>
          <div className="min-w-0">
            <p className="type-caption text-zinc-500">Total PnL</p>
            <p
              className={cn(
                "mt-1 truncate text-base font-semibold tabular-nums sm:text-lg",
                pnlTone,
              )}
            >
              {pnl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
