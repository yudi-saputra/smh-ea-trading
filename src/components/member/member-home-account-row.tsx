"use client";

import Link from "next/link";
import { MonitorSmartphoneIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, formatMoneySigned } from "@/lib/money";
import { useMemberEaStatusLive } from "@/components/member/use-member-ea-status-live";

function pnlTone(value: number | null | undefined) {
  if (value == null || value === 0 || Number.isNaN(value)) {
    return "text-muted-foreground";
  }
  return value > 0 ? "text-trading-profit" : "text-trading-loss";
}

export function MemberHomeAccountRow({
  id,
  terminalId,
  online,
  status,
  expired,
  equity,
  dailyPnl,
  href,
}: {
  id: string;
  terminalId: string;
  online: boolean;
  status: string | null | undefined;
  expired: boolean;
  equity: number | null;
  dailyPnl: number | null;
  href: string;
}) {
  const ea = useMemberEaStatusLive(id, online, status, expired);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/20 focus-visible:bg-accent/20 focus-visible:outline-none active:bg-accent/30"
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          ea.tile,
        )}
        aria-hidden
      >
        <MonitorSmartphoneIcon className={cn("size-4.5", ea.text)} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="type-ui truncate font-semibold tabular-nums tracking-tight">
          {terminalId}
        </p>
        <p
          className={cn(
            "type-micro mt-0.5 font-medium uppercase tracking-wide",
            ea.text,
          )}
        >
          {ea.label.toUpperCase()}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="type-ui font-semibold tabular-nums tracking-tight">
          {formatMoney(equity)}
        </p>
        <p
          className={cn("type-caption mt-0.5 tabular-nums", pnlTone(dailyPnl))}
        >
          {formatMoneySigned(dailyPnl)}
        </p>
      </div>
    </Link>
  );
}
