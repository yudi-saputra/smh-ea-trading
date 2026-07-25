"use client";

import { useState } from "react";
import { SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
  mode?: number | null;
  entryMode?: number | null;
} | null;

function formatNum(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function pnlClass(value: string | number | null | undefined) {
  if (value == null || value === "") return "text-foreground";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n) || n === 0) return "text-foreground";
  return n > 0 ? "text-trading-profit" : "text-trading-loss";
}

export function MemberDetailAccount({
  snap,
  online = true,
  settings,
}: {
  snap: SnapshotData | null;
  online?: boolean;
  settings?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const equity = snap?.equity ?? null;
  const balance = snap?.balance ?? null;
  const floatPnl = snap?.floatPnl ?? null;
  const dailyPnl = snap?.dailyPnl ?? null;

  const modeLabel =
    snap?.mode == null ? "—" : snap.mode === 1 ? "Aggressive" : "Conservative";
  const entryLabel =
    snap?.entryMode == null ? "—" : snap.entryMode === 1 ? "1 Arah" : "2 Arah";
  const isOn = online && snap?.status?.toLowerCase() === "on";

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              isOn ? "bg-trading-profit" : "bg-muted-foreground/50",
            )}
            aria-label={isOn ? "ON" : "OFF"}
          />
          <h3 className="type-ui truncate font-semibold">Detail Account</h3>
        </div>
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

      {!snap ? (
        <div className="type-caption px-4 py-8 text-center text-muted-foreground">
          Belum ada snapshot. Tunggu heartbeat Controller.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px border-b border-border/50 bg-border/40">
            <HeroStat label="Equity" value={formatNum(equity)} />
            <HeroStat
              label="Float"
              value={formatNum(floatPnl)}
              valueClass={pnlClass(floatPnl)}
            />
            <HeroStat
              label="Daily"
              value={formatNum(dailyPnl)}
              valueClass={pnlClass(dailyPnl)}
            />
          </div>

          <div className="space-y-4 px-4 py-4">
            <Group title="Account">
              <Metric label="Balance" value={formatNum(balance)} />
              <Metric
                label="Positions"
                value={snap.positions?.toString() ?? "—"}
              />
              <Metric
                label="Buy / Sell"
                value={`${snap.buy ?? 0} / ${snap.sell ?? 0}`}
              />
            </Group>

            <Group title="Strategy">
              <Metric label="Mode" value={modeLabel} />
              <Metric label="Entry" value={entryLabel} />
            </Group>
          </div>
        </>
      )}

      {settings ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="mx-auto w-full max-w-[430px] md:max-w-[768px]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Settings</DrawerTitle>
              <DrawerDescription>
                Atur parameter tambahan EA Trading anda
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
    <div className="bg-card px-3 py-3.5 text-center">
      <p className="type-label tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("type-title mt-1 tabular-nums", valueClass)}>{value}</p>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="type-label mb-2 text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <dl className="divide-y divide-border/50">{children}</dl>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <dt className="type-body-sm text-muted-foreground">{label}</dt>
      <dd className="type-body-sm truncate text-right font-medium tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
