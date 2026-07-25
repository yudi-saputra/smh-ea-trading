import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function formatNum(value: string | number | null | undefined) {
  if (value == null || value === "") return "0";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function pnlTone(value: string | number | null | undefined) {
  if (value == null || value === "") return "text-foreground";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n) || n === 0) return "text-foreground";
  return n > 0 ? "text-trading-profit" : "text-trading-loss";
}

function eaTone(status: string) {
  const s = status.toLowerCase();
  if (s === "on") return "text-trading-profit bg-trading-profit/10";
  if (s === "paused") return "text-trading-gold bg-trading-gold/10";
  if (s === "offline" || s === "off") {
    return "text-trading-loss bg-trading-loss/10";
  }
  return "text-muted-foreground bg-muted";
}

export type MemberAccountCardData = {
  id: string;
  name: string;
  terminalId: string;
  online: boolean;
  status: string;
  balance: string | null;
  dailyPnl: string | null;
  expiresLabel: string;
  expiryState: "none" | "active" | "expiring" | "expired";
};

export function MemberAccountCard({
  account,
}: {
  account: MemberAccountCardData;
}) {
  const status = account.online ? account.status || "—" : "offline";

  return (
    <Link
      href={`/member/account/${account.id}`}
      className="group block overflow-hidden rounded-2xl border border-border/80 bg-card transition-colors active:bg-accent/25"
    >
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="type-title truncate">{account.name}</p>
          <p className="type-caption mt-0.5 truncate text-muted-foreground">
            {account.terminalId}
          </p>
        </div>
        <span
          className={cn(
            "type-micro shrink-0 rounded-full px-2 py-0.5 font-normal uppercase tracking-wide",
            eaTone(status),
          )}
        >
          {status.toUpperCase()}
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/70 transition-transform group-active:translate-x-0.5" />
      </div>

      <dl className="divide-y divide-border/50 px-4">
        <Row label="Balance">
          <span className="tabular-nums">{formatNum(account.balance)}</span>
        </Row>
        <Row label="PnL">
          <span className={cn("tabular-nums", pnlTone(account.dailyPnl))}>
            {formatNum(account.dailyPnl)}
          </span>
        </Row>
        <Row label="Expired">
          <span
            className={cn(
              account.expiryState === "expired" && "text-trading-loss",
              account.expiryState === "expiring" && "text-trading-gold",
              account.expiryState === "active" && "text-trading-profit",
            )}
          >
            {account.expiresLabel}
          </span>
        </Row>
      </dl>
    </Link>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="type-body-sm text-muted-foreground">{label}</dt>
      <dd className="type-body-sm truncate text-right font-medium text-foreground">
        {children}
      </dd>
    </div>
  );
}
