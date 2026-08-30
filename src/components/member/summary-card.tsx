import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  equity: string;
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

export function MemberSummaryCard({
  equity,
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
        "relative z-0 overflow-hidden rounded-2xl p-5 text-zinc-50 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.7)] ring-1 ring-trading-gold/15",
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-linear-to-br from-[#17130d] via-[#221a11] to-[#0b0a09]"
        aria-hidden
      />

      {/* Bevelled top edge — the gold catch-light that reads as metal */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-trading-gold/50 to-transparent"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-trading-gold/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 left-0 size-36 rounded-full bg-trading-gold/8 blur-2xl"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[38%] min-w-28 max-w-40 sm:w-[36%] sm:max-w-52"
        aria-hidden
      >
        <Image
          src={mascotSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 40vw, 208px"
          className="object-contain object-bottom-right"
          priority={false}
        />
      </div>

      <div className="relative z-10">
        <div className="max-w-[62%] sm:max-w-[68%]">
          <p className="type-label text-white/40">Total Equity</p>
          <p className="mt-1.5 truncate text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
            {equity}
          </p>
        </div>

        <div className="mt-4 grid max-w-[88%] grid-cols-2 gap-x-6 sm:mt-6 sm:max-w-[72%] sm:gap-x-10">
          <div className="min-w-0">
            <p className="type-label text-white/40">
              Total PnL
            </p>
            <p
              className={cn(
                "mt-1 truncate text-base font-semibold tabular-nums sm:text-lg",
                pnlTone,
              )}
            >
              {pnl}
            </p>
          </div>
          <div className="min-w-0">
            <p className="type-label text-white/40">
              Growth
            </p>
            <p
              className={cn(
                "mt-1 truncate text-base font-semibold tabular-nums sm:text-lg",
                growthTone,
              )}
            >
              {formatGrowth(growthPct)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
