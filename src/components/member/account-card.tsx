import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { memberEaStatus } from "@/lib/ea-status";
import { formatMoney, formatMoneySigned } from "@/lib/money";

function pnlTone(value: string | number | null | undefined) {
  if (value == null || value === "") return "text-foreground";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n) || n === 0) return "text-foreground";
  return n > 0 ? "text-trading-profit" : "text-trading-loss";
}

/** Shared copy; the caller owns the container since context differs. */
export function MemberAccountsEmpty({ className }: { className?: string }) {
  return (
    <div className={cn("px-4 py-10 text-center", className)}>
      <p className="type-ui font-medium">Belum ada akun</p>
      <p className="type-caption mt-1 text-muted-foreground">
        Hubungi admin untuk menambahkan akun ke profil Anda.
      </p>
    </div>
  );
}

export type MemberAccountCardData = {
  id: string;
  name: string;
  terminalId: string;
  online: boolean;
  status: string;
  equity: string | null;
  dailyPnl: string | null;
  expiresLabel: string;
  expiryState: "none" | "active" | "expiring" | "expired";
};

export function MemberAccountCard({
  account,
}: {
  account: MemberAccountCardData;
}) {
  const expired = account.expiryState === "expired";
  const ea = memberEaStatus(account.online, account.status, expired);

  return (
    <Link
      href={`/member/account/${account.id}`}
      className="group block overflow-hidden rounded-2xl border border-border/80 bg-card transition-colors outline-none hover:bg-accent/20 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-accent/25"
    >
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="type-title truncate">{account.name}</p>
          <p className="type-caption mt-0.5 truncate tabular-nums text-muted-foreground">
            {account.terminalId}
          </p>
        </div>
        <span
          className={cn("type-label shrink-0 rounded-full px-2 py-1", ea.pill)}
        >
          {ea.label}
        </span>
        <ChevronRightIcon
          className="size-4 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
          aria-hidden
        />
      </div>

      <dl className="grid grid-cols-2 divide-x divide-border/50">
        <Metric label="Equity" value={formatMoney(account.equity)} />
        <Metric
          label="PnL"
          value={formatMoneySigned(account.dailyPnl)}
          tone={pnlTone(account.dailyPnl)}
        />
      </dl>

      <div className="flex items-center justify-between gap-3 border-t border-border/50 bg-muted/30 px-4 py-2.5">
        <span className="type-caption text-muted-foreground">
          {expired ? "Kedaluwarsa" : "Masa aktif"}
        </span>
        <span
          className={cn(
            "type-caption truncate font-medium",
            expired && "text-trading-loss",
            account.expiryState === "expiring" && "text-trading-gold",
          )}
        >
          {account.expiresLabel}
        </span>
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="px-4 py-3">
      <dt className="type-label text-muted-foreground">{label}</dt>
      <dd className={cn("type-title mt-1 truncate tabular-nums", tone)}>
        {value}
      </dd>
    </div>
  );
}
