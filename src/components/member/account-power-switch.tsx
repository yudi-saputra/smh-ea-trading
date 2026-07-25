"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PowerIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MemberAccountPowerSwitch({
  terminalId,
  enabled,
  status,
  online = true,
}: {
  terminalId: string;
  enabled: boolean;
  status: string | null | undefined;
  online?: boolean;
}) {
  const router = useRouter();
  const serverOn =
    online &&
    (status?.toLowerCase() === "on" || status?.toLowerCase() === "paused");
  const [isOn, setIsOn] = useState(serverOn);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsOn(serverOn);
  }, [serverOn]);

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [router]);

  async function togglePower() {
    if (!enabled || !online || busy) return;
    setBusy(true);
    const next = !isOn;
    const nextCommand = next ? "/on" : "/off";

    try {
      const res = await fetch(`/api/account/${terminalId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nextCommand }),
      });
      if (!res.ok) return;
      setIsOn(next);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  const canToggle = enabled && online && !busy;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <p className="type-ui font-semibold">EA Power</p>
          <p className="type-caption mt-0.5 leading-relaxed text-muted-foreground">
            {!online
              ? "Status EA Offline"
              : enabled
                ? "Perintah ON / OFF ke EA"
                : "EA tidak aktif / terblokir"}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          disabled={!canToggle}
          onClick={togglePower}
          className={cn(
            "relative flex h-11 w-24 shrink-0 items-center rounded-full border p-1 transition-colors",
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
