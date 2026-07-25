"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronRightIcon,
  LogOutIcon,
  MonitorSmartphoneIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type SessionRow = {
  id: string;
  device: string;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
};

type ConfirmState =
  | { kind: "one"; sessionId: string }
  | { kind: "all" }
  | null;

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MemberLoginSessions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const busy = !!revokingId || revokingAll;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/member/auth/sessions");
      const data = (await res.json()) as {
        sessions?: SessionRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat sesi");
        return;
      }
      setSessions(data.sessions ?? []);
    } catch {
      setError("Koneksi gagal, coba lagi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function revoke(sessionId: string) {
    if (busy) return;
    setRevokingId(sessionId);
    setError(null);
    try {
      const res = await fetch("/api/member/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json()) as {
        wasCurrent?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Gagal mengakhiri sesi");
        return;
      }
      if (data.wasCurrent) {
        window.location.href = "/member/login";
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      router.refresh();
    } catch {
      setError("Koneksi gagal, coba lagi");
    } finally {
      setRevokingId(null);
    }
  }

  async function revokeAll() {
    if (busy || sessions.length === 0) return;
    setRevokingAll(true);
    setError(null);
    try {
      const res = await fetch("/api/member/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal mengakhiri semua sesi");
        setRevokingAll(false);
        return;
      }
      window.location.href = "/member/login";
    } catch {
      setError("Koneksi gagal, coba lagi");
      setRevokingAll(false);
    }
  }

  function requestRevoke(sessionId: string, isCurrent: boolean) {
    if (busy) return;
    if (isCurrent) {
      setConfirm({ kind: "one", sessionId });
      return;
    }
    void revoke(sessionId);
  }

  function onConfirmAction() {
    if (!confirm) return;
    if (confirm.kind === "all") {
      setConfirm(null);
      void revokeAll();
      return;
    }
    const id = confirm.sessionId;
    setConfirm(null);
    void revoke(id);
  }

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-3.5 text-left transition-colors active:bg-accent/30"
          >
            <MonitorSmartphoneIcon
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="type-ui min-w-0 flex-1 font-medium">
              Sesi Login
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/70" />
          </button>
        </DrawerTrigger>

        <DrawerContent className="mx-auto w-full max-w-[430px] md:max-w-[768px]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Sesi Login</DrawerTitle>
            <DrawerDescription>
              Perangkat yang sedang login ke akun Anda. Akhiri sesi yang tidak
              dikenal.
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4">
            {error ? (
              <p className="type-body rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-destructive">
                {error}
              </p>
            ) : null}

            {loading && sessions.length === 0 ? (
              <p className="type-caption py-8 text-center text-muted-foreground">
                Memuat sesi…
              </p>
            ) : null}

            {!loading && !error && sessions.length === 0 ? (
              <p className="type-caption py-8 text-center text-muted-foreground">
                Tidak ada sesi aktif.
              </p>
            ) : null}

            {sessions.length > 0 ? (
              <ul className="overflow-hidden rounded-xl border border-border/60">
                {sessions.map((s, i) => (
                  <li
                    key={s.id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-3",
                      i > 0 && "border-t border-border/50",
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="type-ui font-semibold">{s.device}</p>
                        {s.current ? (
                          <span className="type-micro rounded-md bg-trading-profit/15 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-trading-profit">
                            Perangkat ini
                          </span>
                        ) : null}
                      </div>
                      <p className="type-caption text-muted-foreground">
                        Login: {formatWhen(s.createdAt)}
                      </p>
                      <p className="type-caption text-muted-foreground">
                        Terakhir aktif: {formatWhen(s.lastSeenAt)}
                      </p>
                      {s.ip ? (
                        <p className="type-caption font-mono text-muted-foreground/80">
                          IP {s.ip}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => requestRevoke(s.id, s.current)}
                      className="h-8 shrink-0 gap-1 rounded-md px-2"
                      aria-label={
                        s.current ? "Keluar dari perangkat ini" : "Akhiri sesi"
                      }
                    >
                      <Trash2Icon className="size-3.5" aria-hidden />
                      {revokingId === s.id ? "…" : "Akhiri"}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {sessions.length > 0 ? (
            <DrawerFooter className="px-4 pb-6">
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => setConfirm({ kind: "all" })}
                className="h-11 w-full gap-2 rounded-xl"
              >
                <LogOutIcon className="size-4" aria-hidden />
                {revokingAll ? "Mengakhiri…" : "Akhiri Semua Sesi"}
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={confirm != null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "all"
                ? "Akhiri semua sesi?"
                : "Keluar dari perangkat ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "all"
                ? "Semua perangkat akan logout, termasuk perangkat ini. Anda harus login ulang."
                : "Sesi di perangkat ini akan diakhiri. Anda harus login ulang."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={onConfirmAction}
            >
              {confirm?.kind === "all" ? "Akhiri Semua" : "Keluar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
