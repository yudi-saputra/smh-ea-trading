"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircleIcon, ScrollTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type Props = {
  terminalId: string;
  enabled: boolean;
  status: string | null | undefined;
  mode: number | null | undefined;
  entryMode: number | null | undefined;
  logs?: React.ReactNode;
};

export function MemberAccountControls({
  terminalId,
  enabled,
  status,
  mode,
  entryMode,
  logs,
}: Props) {
  const router = useRouter();
  const serverPaused = status?.toLowerCase() === "paused";
  const serverMode = mode ?? 0;
  const serverEntry = entryMode ?? 0;

  const [paused, setPaused] = useState(serverPaused);
  const [modeState, setModeState] = useState(serverMode);
  const [entryState, setEntryState] = useState(serverEntry);
  const [busy, setBusy] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);

  useEffect(() => setPaused(serverPaused), [serverPaused]);
  useEffect(() => setModeState(serverMode), [serverMode]);
  useEffect(() => setEntryState(serverEntry), [serverEntry]);

  async function send(text: string, applyOptimistic?: () => void) {
    if (!enabled || busy) return;
    setBusy(text);
    try {
      const res = await fetch(`/api/account/${terminalId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      applyOptimistic?.();
      router.refresh();
    } catch {
      // ignore
    } finally {
      setBusy(null);
    }
  }

  const eaLive =
    status?.toLowerCase() === "on" || status?.toLowerCase() === "paused";
  const anyBusy = !!busy;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <p className="type-ui font-semibold">Kontrol</p>
          <p className="type-caption mt-0.5 text-muted-foreground">
            Pause, reset, arah entry, dan mode strategi
          </p>
        </div>
        {logs ? (
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="type-caption h-8 gap-1.5 rounded-md border-border px-2.5 font-semibold"
            onClick={() => setLogsOpen(true)}
          >
            <ScrollTextIcon className="size-3.5" />
            Logs
          </Button>
        ) : null}
      </div>

      <div className="space-y-2.5 p-4">
        <ActionButton
          label={paused ? "RESUME ENTRY" : "PAUSE ENTRY"}
          active={paused}
          loading={busy === "/on" || busy === "/pause"}
          disabled={!enabled || anyBusy || !eaLive}
          onClick={() =>
            send(paused ? "/on" : "/pause", () => setPaused(!paused))
          }
        />

        <ActionButton
          label="RESET TARGET"
          tone="reset"
          loading={busy === "/reset"}
          disabled={!enabled || anyBusy}
          onClick={() => send("/reset")}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <ActionButton
            label="2 ARAH"
            active={entryState === 0}
            loading={busy === "/twoway"}
            disabled={!enabled || anyBusy}
            onClick={() => send("/twoway", () => setEntryState(0))}
          />
          <ActionButton
            label="1 ARAH"
            active={entryState === 1}
            loading={busy === "/oneway"}
            disabled={!enabled || anyBusy}
            onClick={() => send("/oneway", () => setEntryState(1))}
          />
        </div>

        <ActionButton
          label="CONSERVATIVE"
          active={modeState === 0}
          loading={busy === "/conservative"}
          disabled={!enabled || anyBusy}
          onClick={() => send("/conservative", () => setModeState(0))}
        />
        <ActionButton
          label="AGGRESSIVE"
          active={modeState === 1}
          activeColor="red"
          loading={busy === "/aggressive"}
          disabled={!enabled || anyBusy}
          onClick={() => send("/aggressive", () => setModeState(1))}
        />

        {!enabled ? (
          <p className="type-caption pt-1 text-muted-foreground">EA Disabled</p>
        ) : !eaLive ? (
          <p className="type-caption pt-1 text-muted-foreground">
            Pause butuh EA ON dulu.
          </p>
        ) : anyBusy ? (
          <p className="type-caption pt-1 text-muted-foreground">
            Mengirim perintah…
          </p>
        ) : null}
      </div>

      {logs ? (
        <Drawer open={logsOpen} onOpenChange={setLogsOpen}>
          <DrawerContent className="mx-auto w-full max-w-[430px] md:max-w-[768px]">
            <DrawerHeader className="text-left">
              <DrawerTitle>EA Logs</DrawerTitle>
              <DrawerDescription>
                Riwayat command terbaru
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">{logs}</div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </section>
  );
}

function ActionButton({
  label,
  active = false,
  tone = "default",
  activeColor = "green",
  loading = false,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  tone?: "default" | "reset";
  activeColor?: "green" | "red";
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isReset = tone === "reset";
  const isActive = !isReset && active;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-busy={loading}
      className={cn(
        "type-body-sm inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border font-semibold tracking-wide uppercase transition-colors outline-none select-none",
        "disabled:pointer-events-none disabled:opacity-50",
        loading && "!opacity-100",
        isReset &&
          "border-border bg-muted text-foreground hover:bg-muted/80 dark:border-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100",
        !isReset &&
          !isActive &&
          "border-border/80 bg-muted/70 text-foreground hover:bg-muted",
        isActive &&
          activeColor === "green" &&
          "border-green-900 bg-green-900 text-white hover:bg-green-800",
        isActive &&
          activeColor === "red" &&
          "border-red-500 bg-red-500 text-white hover:bg-red-400",
      )}
    >
      {loading ? (
        <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
      ) : null}
      <span>{loading ? "MENUNGGU…" : label}</span>
    </button>
  );
}
