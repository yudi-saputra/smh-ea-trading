"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, LoaderCircleIcon, PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type MartingaleMode,
  simulateLotCapital,
} from "@/lib/lot-sim";

export type LotSimDefaults = {
  baseLot?: string;
  mode?: MartingaleMode;
  multiplier?: string;
  lotIncrement?: string;
  layersPerLot?: string;
  layerPoints?: string;
  pipValueUsd?: string;
  openLayers?: string;
  maxLot?: string;
};

function normalizeDecimal(raw: string) {
  const withDot = raw.replace(/,/g, ".");
  let out = "";
  let seenDot = false;
  for (const ch of withDot) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
      continue;
    }
    if (ch === "." && !seenDot) {
      out += ".";
      seenDot = true;
    }
  }
  return out;
}

function num(raw: string, fallback: number) {
  const n = Number(raw.replace(/,/g, "."));
  return Number.isFinite(n) ? n : fallback;
}

function money(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function lotsFmt(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function LotSimulator({ defaults }: { defaults?: LotSimDefaults }) {
  const [baseLot, setBaseLot] = useState(defaults?.baseLot || "0.01");
  const [mode, setMode] = useState<MartingaleMode>(
    defaults?.mode === "aggressive" ? "aggressive" : "conservative",
  );
  const [multiplier, setMultiplier] = useState(defaults?.multiplier || "1.3");
  const [lotIncrement, setLotIncrement] = useState(
    defaults?.lotIncrement || "0.01",
  );
  const [layersPerLot, setLayersPerLot] = useState(
    defaults?.layersPerLot || "3",
  );
  const [layerPoints, setLayerPoints] = useState(
    defaults?.layerPoints || "500",
  );
  const [pipValueUsd, setPipValueUsd] = useState(
    defaults?.pipValueUsd || "10",
  );
  const [openLayers, setOpenLayers] = useState(defaults?.openLayers || "20");
  const [maxLot, setMaxLot] = useState(defaults?.maxLot || "0");
  const [result, setResult] = useState<ReturnType<
    typeof simulateLotCapital
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ReturnType<
    typeof simulateLotCapital
  > | null>(null);
  const router = useRouter();
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => {
      setResult(pending);
      setPending(null);
      setBusy(false);
    }, 450);
    return () => clearTimeout(t);
  }, [pending]);

  useEffect(() => {
    if (!busy && !result) return;
    const id = requestAnimationFrame(() => {
      outRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [busy, result]);

  function hitung() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    setPending(
      simulateLotCapital({
        baseLot: Math.max(0.01, num(baseLot, 0.01)),
        mode,
        multiplier: Math.max(1, num(multiplier, 1.3)),
        lotIncrement: Math.max(0, num(lotIncrement, 0.01)),
        layersPerLot: Math.max(1, Math.trunc(num(layersPerLot, 3))),
        layerPoints: Math.max(0, num(layerPoints, 500)),
        pipValueUsd: Math.max(0, num(pipValueUsd, 10)),
        openLayers: num(openLayers, 20),
        maxLot: Math.max(0, num(maxLot, 0)),
      }),
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex min-h-14 items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="type-display leading-snug">Simulasi Lot & Modal</h1>
        </div>
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => router.back()}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground transition-colors active:bg-accent/40"
        >
          <ArrowLeftIcon className="size-4" />
        </button>
      </header>

      <section className="space-y-3 rounded-lg border border-border/80 bg-card p-4">
        <div className="space-y-1.5">
          <p className="type-caption font-medium text-muted-foreground">
            Mode Kenaikan Lot
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ModeBtn
              active={mode === "aggressive"}
              onClick={() => setMode("aggressive")}
              title="Agresif"
              icon={XIcon}
            />
            <ModeBtn
              active={mode === "conservative"}
              onClick={() => setMode("conservative")}
              title="Konservatif"
              icon={PlusIcon}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
          <Field label="Lot Awal">
            <Input
              inputMode="decimal"
              value={baseLot}
              onChange={(e) => setBaseLot(normalizeDecimal(e.target.value))}
              className="rounded-lg tabular-nums"
            />
          </Field>

          {mode === "aggressive" ? (
            <Field label="Perkalian">
              <Input
                inputMode="decimal"
                value={multiplier}
                onChange={(e) => setMultiplier(normalizeDecimal(e.target.value))}
                className="rounded-lg tabular-nums"
              />
            </Field>
          ) : (
            <Field label="Pertambahan Lot">
              <Input
                inputMode="decimal"
                value={lotIncrement}
                onChange={(e) =>
                  setLotIncrement(normalizeDecimal(e.target.value))
                }
                className="rounded-lg tabular-nums"
              />
            </Field>
          )}

          {mode === "conservative" ? (
            <Field label="Naik Lot per (x) Layer">
              <Input
                inputMode="numeric"
                value={layersPerLot}
                onChange={(e) =>
                  setLayersPerLot(normalizeDecimal(e.target.value))
                }
                className="rounded-lg tabular-nums"
              />
            </Field>
          ) : null}

          <Field label="Nilai 1 Pip / Lot (USD)">
            <Input
              inputMode="decimal"
              value={pipValueUsd}
              onChange={(e) => setPipValueUsd(normalizeDecimal(e.target.value))}
              className="rounded-lg tabular-nums"
            />
          </Field>

          <Field label="Jumlah Layer Terbuka">
            <Input
              inputMode="numeric"
              value={openLayers}
              onChange={(e) => setOpenLayers(normalizeDecimal(e.target.value))}
              className="rounded-lg tabular-nums"
            />
          </Field>

          <Field label="Max Lot (0 = tanpa batas)">
            <Input
              inputMode="decimal"
              value={maxLot}
              onChange={(e) => setMaxLot(normalizeDecimal(e.target.value))}
              className="rounded-lg tabular-nums"
            />
          </Field>
        </div>

        <Field
          label="Jarak Layer (points)"
          hint="Sama dengan Set Layer, 10 points = 1 pip (broker 5 digit)."
        >
          <Input
            inputMode="decimal"
            value={layerPoints}
            onChange={(e) => setLayerPoints(normalizeDecimal(e.target.value))}
                className="rounded-lg tabular-nums"
          />
        </Field>

        <Button
          type="button"
          className="h-11 w-full rounded-lg text-base font-semibold"
          disabled={busy}
          onClick={hitung}
        >
          {busy ? (
            <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
          ) : null}
          {busy ? "Menghitung…" : "Hitung Simulasi"}
        </Button>
      </section>

      {(busy || result) ? (
      <div ref={outRef} className="scroll-mt-4 space-y-5">
      {busy && !result ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border/80 bg-card py-10 text-muted-foreground">
          <LoaderCircleIcon className="size-5 animate-spin" aria-hidden />
          <p className="type-ui">Menghitung simulasi…</p>
        </div>
      ) : null}

      {result ? (
        <div
          key={`${result.totalLot}-${result.totalFloatingUsd}-${result.levels.length}`}
          className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-5 duration-300"
        >
      <div className="grid grid-cols-2 gap-2.5">
        <SummaryCard
          label="Total Floating"
          value={`$${money(result.totalFloatingUsd)}`}
          tone="loss"
        />
        <SummaryCard
          label="Estimasi Modal"
          value={`$${money(Math.abs(result.totalFloatingUsd))}`}
          tone="ok"
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card px-4 py-3">
        <p className="type-caption text-muted-foreground">
          Total Lot (semua level)
        </p>
        <p className="type-ui font-semibold tabular-nums">
          {lotsFmt(result.totalLot)}
        </p>
      </div>

      <section className="overflow-hidden rounded-lg border border-border/80 bg-card">
        <p className="type-label border-b border-border/60 px-4 py-2.5 tracking-[0.12em] text-muted-foreground">
          Detail per level
        </p>
        <div className="max-h-[min(24rem,50dvh)] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-card">
              <tr className="type-caption text-muted-foreground">
                <th className="px-3 py-2 font-medium">Lvl</th>
                <th className="px-3 py-2 font-medium">Lot</th>
                <th className="px-3 py-2 font-medium">Jarak (pips)</th>
                <th className="px-3 py-2 text-right font-medium">
                  Floating ($)
                </th>
              </tr>
            </thead>
            <tbody>
              {result.levels.map((row) => (
                <tr
                  key={row.level}
                  className="type-body-sm border-t border-border/50"
                >
                  <td className="px-3 py-2 tabular-nums">{row.level}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {lotsFmt(row.lot)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.distancePips.toLocaleString("en-US", {
                      maximumFractionDigits: 1,
                    })}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right tabular-nums",
                      row.floatingUsd < 0
                        ? "text-trading-loss"
                        : "text-foreground",
                    )}
                  >
                    {money(row.floatingUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="type-caption leading-relaxed text-muted-foreground">
        Estimasi Modal = Floating di layer terakhir, bukan margin broker.
        Asumsi semua Level Tersentuh. Di luar Slippage/Spread. Bukan jaminan
        hasil real. Lot dibulatkan ke bawah 0.01.
      </p>
        </div>
      ) : null}
      </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="type-caption font-medium text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="type-caption block text-muted-foreground/80">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function ModeBtn({
  active,
  onClick,
  title,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: typeof XIcon;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      className="h-11 justify-start gap-2 rounded-lg px-3"
      onClick={onClick}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="type-ui font-semibold">{title}</span>
    </Button>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "loss" | "ok";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-4",
        tone === "loss"
          ? "border-trading-loss/30 bg-trading-loss/5"
          : "border-trading-profit/30 bg-trading-profit/5",
      )}
    >
      <p className="type-label tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold tabular-nums tracking-tight md:text-xl",
          tone === "loss" ? "text-trading-loss" : "text-trading-profit",
        )}
      >
        {value}
      </p>
    </div>
  );
}
