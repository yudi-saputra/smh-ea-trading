"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PowerIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isEaPowered, memberEaStatus } from "@/lib/ea-status";

export function MemberAccountPowerSwitch({
  terminalId,
  enabled,
  status,
  online = true,
  expired = false,
}: {
  terminalId: string;
  enabled: boolean;
  status: string | null | undefined;
  online?: boolean;
  expired?: boolean;
}) {
  const router = useRouter();
  const ea = memberEaStatus(online, status, expired);
  const serverOn = isEaPowered(ea.label);
  const [isOn, setIsOn] = useState(serverOn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsOn(serverOn);
  }, [serverOn]);

  const canToggle = enabled && online && !expired && !busy;

  async function togglePower() {
    if (!canToggle) return;
    setBusy(true);
    setError(null);
    const next = !isOn;

    try {
      const res = await fetch(`/api/account/${terminalId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: next ? "/on" : "/off" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Perintah gagal dikirim. Coba lagi.");
        return;
      }
      setIsOn(next);
      router.refresh();
    } catch {
      setError("Tidak ada koneksi. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="type-ui truncate font-semibold">EA Power</p>
            <span
              className={cn(
                "type-label shrink-0 rounded-full px-2 py-1",
                ea.pill,
              )}
            >
              {ea.label}
            </span>
          </div>
          <p
            className={cn(
              "type-caption mt-0.5 leading-relaxed",
              error ? "text-trading-loss" : "text-muted-foreground",
            )}
            role={error ? "alert" : undefined}
          >
            {error
              ? error
              : expired
                ? "Langganan kedaluwarsa"
                : !online
                  ? "Status EA Offline"
                  : enabled
                    ? "Perintah ON / OFF ke EA"
                    : "EA tidak aktif / terblokir"}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-label="EA Power"
          aria-checked={isOn}
          disabled={!canToggle}
          onClick={togglePower}
          className={cn(
            "relative flex h-11 w-24 shrink-0 items-center rounded-2xl border p-1 transition-colors",
            isOn
              ? "justify-end border-trading-profit/40 bg-trading-profit/15"
              : "justify-start border-destructive/40 bg-destructive/15",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <span
            className={cn(
              "type-caption absolute font-bold tracking-wide",
              isOn ? "left-3 text-trading-profit" : "right-3 text-destructive",
            )}
          >
            {isOn ? "ON" : "OFF"}
          </span>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full bg-background shadow-sm",
              isOn ? "text-trading-profit" : "text-destructive",
            )}
          >
            <PowerIcon className="size-4.5" aria-hidden />
          </span>
        </button>
      </div>
    </section>
  );
}
