"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SettingKey =
  | "setlayer"
  | "setmultiplier"
  | "setbaselot"
  | "setlayersper"
  | "settarget"
  | "setcutloss"
  | "maxlot"
  | "maxlayer";

type SettingDef = {
  key: SettingKey;
  command: string;
  label: string;
  min?: number;
  max?: number;
};

type DraftMap = Record<SettingKey, string>;

const SETTINGS: SettingDef[] = [
  { key: "setlayer", command: "/setlayer", label: "Layer", min: 10 },
  {
    key: "setmultiplier",
    command: "/setmultiplier",
    label: "Multiplier",
    min: 1.1,
    max: 10,
  },
  { key: "setbaselot", command: "/setbaselot", label: "Lot Awal", min: 0.01 },
  {
    key: "setlayersper",
    command: "/setlayersper",
    label: "Naik Lot per ( x ) layer",
    min: 1,
  },
  { key: "settarget", command: "/settarget", label: "Target", min: 0 },
  { key: "setcutloss", command: "/setcutloss", label: "Cutloss", min: 0 },
  { key: "maxlot", command: "/maxlot", label: "Max Lot", min: 0 },
  { key: "maxlayer", command: "/maxlayer", label: "Max Layer", min: 0 },
];

const SETTING_KEYS = SETTINGS.map((s) => s.key);

function toInputValue(value: string | number | null | undefined) {
  if (value == null || value === "") return "";
  return String(value).replace(/,/g, ".");
}

function normalizeDecimalInput(raw: string) {
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

function formatCommandNumber(raw: string) {
  const n = Number(raw.replace(/,/g, "."));
  if (Number.isNaN(n)) return null;
  return String(n);
}

function sameNumber(a: string, b: string) {
  if (a === b) return true;
  if (a === "" || b === "") return false;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return false;
  return na === nb;
}

function minutesToHhMm(mins: number | null | undefined) {
  if (mins == null || Number.isNaN(mins)) return "";
  const m = ((Math.trunc(mins) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseHhMm(raw: string): number | null {
  const t = raw.trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(mm) || h < 0 || h > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return h * 60 + mm;
}

function normalizeTimeInput(raw: string) {
  let out = "";
  for (const ch of raw) {
    if ((ch >= "0" && ch <= "9") || ch === ":") out += ch;
  }
  return out.slice(0, 5);
}

function valuesToDraft(values: {
  layer?: string | null;
  multiplier?: string | null;
  baseLot?: string | null;
  layersPerLot?: number | null;
  target?: string | null;
  cutloss?: string | null;
  maxLot?: string | null;
  maxLayer?: number | null;
}): DraftMap {
  return {
    setlayer: toInputValue(values.layer),
    setmultiplier: toInputValue(values.multiplier),
    setbaselot: toInputValue(values.baseLot),
    setlayersper: toInputValue(values.layersPerLot),
    settarget: toInputValue(values.target),
    setcutloss: toInputValue(values.cutloss),
    maxlot: toInputValue(values.maxLot),
    maxlayer: toInputValue(values.maxLayer),
  };
}

export function MemberAccountSettings({
  terminalId,
  enabled,
  values,
}: {
  terminalId: string;
  enabled: boolean;
  values: {
    layer?: string | null;
    multiplier?: string | null;
    baseLot?: string | null;
    layersPerLot?: number | null;
    target?: string | null;
    cutloss?: string | null;
    maxLot?: string | null;
    maxLayer?: number | null;
    tradeTime?: boolean | null;
    tradeStartMin?: number | null;
    tradeEndMin?: number | null;
  };
}) {
  const router = useRouter();
  const server = useMemo(
    () => valuesToDraft(values),
    [
      values.layer,
      values.multiplier,
      values.baseLot,
      values.layersPerLot,
      values.target,
      values.cutloss,
      values.maxLot,
      values.maxLayer,
    ],
  );

  const serverTradeTime = values.tradeTime ?? true;
  const serverStart = minutesToHhMm(values.tradeStartMin ?? 7 * 60);
  const serverEnd = minutesToHhMm(values.tradeEndMin ?? 17 * 60);

  const [pending, setPending] = useState<Partial<Record<SettingKey, string>>>(
    {},
  );
  const [draft, setDraft] = useState<DraftMap>(server);
  const syncedRef = useRef<DraftMap>(server);
  const [busyKey, setBusyKey] = useState<SettingKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tradeTimeOn, setTradeTimeOn] = useState(serverTradeTime);
  const [tradeStart, setTradeStart] = useState(serverStart);
  const [tradeEnd, setTradeEnd] = useState(serverEnd);
  const [pendingTradeTime, setPendingTradeTime] = useState<boolean | null>(
    null,
  );
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);
  const [busyHours, setBusyHours] = useState<
    "tradetime" | "tradewindow" | null
  >(null);
  const syncedHoursRef = useRef({
    on: serverTradeTime,
    start: serverStart,
    end: serverEnd,
  });

  const baseline = useMemo(() => {
    const next = { ...server };
    for (const key of SETTING_KEYS) {
      const p = pending[key];
      if (p != null) next[key] = p;
    }
    return next;
  }, [server, pending]);

  const baselineOn =
    pendingTradeTime != null ? pendingTradeTime : serverTradeTime;
  const baselineStart = pendingStart ?? serverStart;
  const baselineEnd = pendingEnd ?? serverEnd;

  useEffect(() => {
    setPending((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of SETTING_KEYS) {
        const p = prev[key];
        if (p != null && sameNumber(server[key], p)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    setDraft((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of SETTING_KEYS) {
        const p = pending[key];
        if (p != null) {
          if (prev[key] !== p) {
            next[key] = p;
            changed = true;
          }
          continue;
        }
        if (sameNumber(prev[key], syncedRef.current[key])) {
          if (!sameNumber(prev[key], server[key])) {
            next[key] = server[key];
            changed = true;
          }
        }
      }
      syncedRef.current = { ...server };
      for (const key of SETTING_KEYS) {
        if (pending[key] != null) {
          syncedRef.current[key] = pending[key]!;
        }
      }
      return changed ? next : prev;
    });
  }, [server, pending]);

  useEffect(() => {
    if (pendingTradeTime != null && pendingTradeTime === serverTradeTime) {
      setPendingTradeTime(null);
    }
    if (pendingStart != null && pendingStart === serverStart) {
      setPendingStart(null);
    }
    if (pendingEnd != null && pendingEnd === serverEnd) {
      setPendingEnd(null);
    }

    setTradeTimeOn((prev) => {
      if (pendingTradeTime != null) return pendingTradeTime;
      if (prev === syncedHoursRef.current.on) return serverTradeTime;
      return prev;
    });
    setTradeStart((prev) => {
      if (pendingStart != null) return pendingStart;
      if (prev === syncedHoursRef.current.start) return serverStart;
      return prev;
    });
    setTradeEnd((prev) => {
      if (pendingEnd != null) return pendingEnd;
      if (prev === syncedHoursRef.current.end) return serverEnd;
      return prev;
    });

    syncedHoursRef.current = {
      on: pendingTradeTime ?? serverTradeTime,
      start: pendingStart ?? serverStart,
      end: pendingEnd ?? serverEnd,
    };
  }, [
    serverTradeTime,
    serverStart,
    serverEnd,
    pendingTradeTime,
    pendingStart,
    pendingEnd,
  ]);

  useEffect(() => {
    const hasPending =
      Object.keys(pending).length > 0 ||
      pendingTradeTime != null ||
      pendingStart != null ||
      pendingEnd != null;
    if (!hasPending) return;
    const t = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(t);
  }, [pending, pendingTradeTime, pendingStart, pendingEnd, router]);

  async function postCommand(text: string) {
    const res = await fetch(`/api/account/${terminalId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Gagal kirim command");
    }
  }

  async function apply(def: SettingDef) {
    if (!enabled || busyKey || busyHours) return;
    const raw = draft[def.key].trim();
    if (!raw) {
      setError(`${def.label} wajib diisi`);
      return;
    }
    const payload = formatCommandNumber(raw);
    if (payload == null) {
      setError(`${def.label} harus angka (pakai titik, contoh 1.3)`);
      return;
    }
    const num = Number(payload);
    if (def.min != null && num < def.min) {
      setError(`${def.label}: min ${def.min}`);
      return;
    }
    if (def.max != null && num > def.max) {
      setError(`${def.label}: max ${def.max}`);
      return;
    }

    setBusyKey(def.key);
    setError(null);
    try {
      await postCommand(`${def.command} ${payload}`);
      setPending((prev) => ({ ...prev, [def.key]: payload }));
      setDraft((prev) => ({ ...prev, [def.key]: payload }));
      syncedRef.current = { ...syncedRef.current, [def.key]: payload };
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusyKey(null);
    }
  }

  async function applyTradeTime() {
    if (!enabled || busyKey || busyHours) return;
    setBusyHours("tradetime");
    setError(null);
    try {
      await postCommand(`/tradetime ${tradeTimeOn ? "on" : "off"}`);
      setPendingTradeTime(tradeTimeOn);
      syncedHoursRef.current.on = tradeTimeOn;
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusyHours(null);
    }
  }

  async function applyTradeWindow() {
    if (!enabled || busyKey || busyHours) return;
    const startMins = parseHhMm(tradeStart);
    const endMins = parseHhMm(tradeEnd);
    if (startMins == null) {
      setError("Start jam format HH:MM (contoh 07:00)");
      return;
    }
    if (endMins == null) {
      setError("End jam format HH:MM (contoh 17:00)");
      return;
    }
    const startPayload = minutesToHhMm(startMins);
    const endPayload = minutesToHhMm(endMins);
    const startDirty = startPayload !== baselineStart;
    const endDirty = endPayload !== baselineEnd;
    if (!startDirty && !endDirty) return;

    setBusyHours("tradewindow");
    setError(null);
    try {
      if (startDirty) {
        await postCommand(`/tradestart ${startPayload}`);
        setTradeStart(startPayload);
        setPendingStart(startPayload);
        syncedHoursRef.current.start = startPayload;
      }
      if (endDirty) {
        await postCommand(`/tradeend ${endPayload}`);
        setTradeEnd(endPayload);
        setPendingEnd(endPayload);
        syncedHoursRef.current.end = endPayload;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusyHours(null);
    }
  }

  const dirtyTime = tradeTimeOn !== baselineOn;
  const dirtyWindow =
    tradeStart !== baselineStart || tradeEnd !== baselineEnd;

  return (
    <div className="space-y-4">
      <div>
        <p className="type-label mb-2 text-muted-foreground">
          Trading Hours (WIB)
        </p>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <ul className="divide-y divide-border/50">
            <li className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="type-body-sm shrink-0 text-muted-foreground">
                Schedule
              </span>
              <div className="flex min-w-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={!enabled || !!busyKey || !!busyHours}
                  onClick={() => setTradeTimeOn(true)}
                  className={cn(
                    "type-micro h-8 rounded-md px-2.5 font-semibold uppercase",
                    tradeTimeOn
                      ? "bg-trading-profit/15 text-trading-profit"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  ON
                </button>
                <button
                  type="button"
                  disabled={!enabled || !!busyKey || !!busyHours}
                  onClick={() => setTradeTimeOn(false)}
                  className={cn(
                    "type-micro h-8 rounded-md px-2.5 font-semibold uppercase",
                    !tradeTimeOn
                      ? "bg-trading-loss/15 text-trading-loss"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  OFF
                </button>
                <Button
                  type="button"
                  size="xs"
                  variant={dirtyTime ? "default" : "secondary"}
                  disabled={!enabled || !!busyKey || !!busyHours || !dirtyTime}
                  onClick={() => void applyTradeTime()}
                  className="type-micro h-8 min-w-10 rounded-md px-2 font-semibold uppercase"
                >
                  {busyHours === "tradetime" ? "…" : "Set"}
                </Button>
              </div>
            </li>
            <li className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="type-body-sm shrink-0 text-muted-foreground">
                Hours
              </span>
              <div className="flex min-w-0 items-center gap-1.5">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="07:00"
                  aria-label="Start WIB"
                  autoComplete="off"
                  disabled={!enabled || !!busyKey || !!busyHours}
                  value={tradeStart}
                  onChange={(e) =>
                    setTradeStart(normalizeTimeInput(e.target.value))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void applyTradeWindow();
                  }}
                  className="type-body-sm h-8 w-[72px] rounded-md border-border/70 bg-transparent px-2 text-center font-medium tabular-nums shadow-none md:text-[length:var(--type-body-sm)]"
                />
                <span className="type-body-sm text-muted-foreground">–</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="17:00"
                  aria-label="End WIB"
                  autoComplete="off"
                  disabled={!enabled || !!busyKey || !!busyHours}
                  value={tradeEnd}
                  onChange={(e) =>
                    setTradeEnd(normalizeTimeInput(e.target.value))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void applyTradeWindow();
                  }}
                  className="type-body-sm h-8 w-[72px] rounded-md border-border/70 bg-transparent px-2 text-center font-medium tabular-nums shadow-none md:text-[length:var(--type-body-sm)]"
                />
                <Button
                  type="button"
                  size="xs"
                  variant={dirtyWindow ? "default" : "secondary"}
                  disabled={
                    !enabled || !!busyKey || !!busyHours || !dirtyWindow
                  }
                  onClick={() => void applyTradeWindow()}
                  className="type-micro h-8 min-w-10 rounded-md px-2 font-semibold uppercase"
                >
                  {busyHours === "tradewindow" ? "…" : "Set"}
                </Button>
              </div>
            </li>
          </ul>
        </div>
        <p className="type-caption mt-1.5 text-muted-foreground">
          OFF = Jam Trading Flexible, ON/OFF EA Tergantung Keinginan Anda.
        </p>
      </div>

      <div>
        <p className="type-label mb-2 text-muted-foreground">Strategy</p>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <ul className="divide-y divide-border/50">
            {SETTINGS.map((def) => {
              const dirty = !sameNumber(draft[def.key], baseline[def.key]);
              return (
                <li
                  key={def.key}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <span className="type-body-sm shrink-0 text-muted-foreground">
                    {def.label}
                  </span>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Input
                      type="text"
                      inputMode="decimal"
                      lang="en"
                      autoComplete="off"
                      disabled={!enabled || !!busyKey || !!busyHours}
                      value={draft[def.key]}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [def.key]: normalizeDecimalInput(e.target.value),
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void apply(def);
                      }}
                      className="type-body-sm h-8 w-[88px] rounded-md border-border/70 bg-transparent px-2 text-right font-medium tabular-nums shadow-none md:text-[length:var(--type-body-sm)]"
                    />
                    <Button
                      type="button"
                      size="xs"
                      variant={dirty ? "default" : "secondary"}
                      disabled={
                        !enabled || !!busyKey || !!busyHours || !dirty
                      }
                      onClick={() => void apply(def)}
                      className="type-micro h-8 min-w-10 rounded-md px-2 font-semibold uppercase"
                    >
                      {busyKey === def.key ? "…" : "Set"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {!enabled ? (
        <p className="type-caption text-muted-foreground">
          Terminal disabled — settings blocked.
        </p>
      ) : null}
      {error ? <p className="type-caption text-destructive">{error}</p> : null}
    </div>
  );
}
