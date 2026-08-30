"use client";

import Link from "next/link";
import { useState } from "react";
import { CalculatorIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { memberEaStatus } from "@/lib/ea-status";
import { formatMoney, formatMoneySigned } from "@/lib/money";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type SnapshotData = {
  status?: string | null;
  symbol?: string | null;
  account?: string | number | null;
  balance?: string | null;
  equity?: string | null;
  floatPnl?: string | null;
  dailyPnl?: string | null;
  positions?: number | null;
  buy?: number | null;
  sell?: number | null;
} | null;

function pnlClass(value: string | number | null | undefined) {
  if (value == null || value === "") return "text-foreground";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n) || n === 0) return "text-foreground";
  return n > 0 ? "text-trading-profit" : "text-trading-loss";
}

function countPair(a: number | null | undefined, b: number | null | undefined) {
  if (a == null && b == null) return "—";
  return `${a ?? "—"} / ${b ?? "—"}`;
}

export function MemberAccountDetail({
  snap,
  online = true,
  expired = false,
  name,
  idTrading,
  expiresLabel,
  expiryState,
  settings,
  simHref,
}: {
  snap: SnapshotData | null;
  online?: boolean;
  expired?: boolean;
  name: string;
  idTrading?: string | null;
  expiresLabel: string;
  expiryState: "none" | "active" | "expiring" | "expired";
  settings?: React.ReactNode;
  simHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const ea = memberEaStatus(online, snap?.status, expired);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="type-title truncate">{name}</p>
          <p className="type-caption mt-0.5 truncate tabular-nums text-muted-foreground">
            {idTrading?.trim() || "—"}
          </p>
        </div>
        <span
          className={cn("type-label shrink-0 rounded-full px-2 py-1", ea.pill)}
        >
          {ea.label}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {simHref ? (
            <Button
              asChild
              size="xs"
              variant="outline"
              className="type-caption h-8 gap-1.5 rounded-md border-border px-2.5 font-semibold"
            >
              <Link href={simHref}>
                <CalculatorIcon className="size-3.5" />
                Simulasi
              </Link>
            </Button>
          ) : null}
          {settings ? (
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="type-caption h-8 gap-1.5 rounded-md border-border px-2.5 font-semibold"
              onClick={() => setOpen(true)}
            >
              <SettingsIcon className="size-3.5" />
              Setting
            </Button>
          ) : null}
        </div>
      </div>

      {!snap ? (
        <div className="type-caption px-4 py-8 text-center text-muted-foreground">
          Belum ada snapshot, mohon tunggu beberapa saat.
        </div>
      ) : (
        <>
          <div className="px-4 py-4">
            <p className="type-label text-muted-foreground">Equity</p>
            <p className="type-display mt-1 truncate tabular-nums">
              {formatMoney(snap.equity)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px border-y border-border/50 bg-border/40">
            <HeroStat
              label="Float"
              value={formatMoneySigned(snap.floatPnl)}
              valueClass={pnlClass(snap.floatPnl)}
            />
            <HeroStat
              label="PnL"
              value={formatMoneySigned(snap.dailyPnl)}
              valueClass={pnlClass(snap.dailyPnl)}
            />
          </div>

          <dl className="divide-y divide-border/50 px-4">
            <Metric label="Balance" value={formatMoney(snap.balance)} />
            <Metric
              label="Positions"
              value={snap.positions?.toString() ?? "—"}
            />
            <Metric
              label="Buy / Sell"
              value={countPair(snap.buy, snap.sell)}
            />
          </dl>
        </>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border/50 bg-muted/30 px-4 py-2.5">
        <span className="type-caption text-muted-foreground">
          {expired ? "Kedaluwarsa" : "Masa aktif"}
        </span>
        <span
          className={cn(
            "type-caption truncate font-medium",
            expired && "text-trading-loss",
            expiryState === "expiring" && "text-trading-gold",
          )}
        >
          {expiresLabel}
        </span>
      </div>

      {settings ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="mx-auto w-full max-w-107.5 md:max-w-3xl">
            <DrawerHeader className="text-left">
              <DrawerTitle>Settings</DrawerTitle>
              <DrawerDescription>
                Atur parameter tambahan EA Trading Anda
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">{settings}</div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </section>
  );
}

function HeroStat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="type-label text-muted-foreground">{label}</p>
      <p className={cn("type-title mt-1 truncate tabular-nums", valueClass)}>
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="type-body-sm text-muted-foreground">{label}</dt>
      <dd className="type-body-sm truncate text-right font-medium tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
