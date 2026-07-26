"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "smh-pwa-install-dismiss";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __smhPwaDeferred?: BeforeInstallPromptEvent | null;
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari
  return Boolean(
    (navigator as Navigator & { standalone?: boolean }).standalone,
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return ios && safari;
}

/** Registers SW + shows install banner when Chrome fires beforeinstallprompt. */
export function MemberPwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    setHidden(false);

    const existing = window.__smhPwaDeferred;
    if (existing) setDeferred(existing);

    function onCapture() {
      if (window.__smhPwaDeferred) setDeferred(window.__smhPwaDeferred);
    }
    window.addEventListener("smh-pwa-deferred", onCapture);

    function onBip(e: Event) {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      window.__smhPwaDeferred = ev;
      setDeferred(ev);
    }
    window.addEventListener("beforeinstallprompt", onBip);

    if (isIosSafari()) setShowIos(true);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/member" })
        .then(() => navigator.serviceWorker.ready)
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("smh-pwa-deferred", onCapture);
      window.removeEventListener("beforeinstallprompt", onBip);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
    setDeferred(null);
    setShowIos(false);
  }

  async function install() {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        window.__smhPwaDeferred = null;
        setDeferred(null);
        setHidden(true);
      }
    } finally {
      setInstalling(false);
    }
  }

  if (hidden) return null;
  if (!deferred && !showIos) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-3">
      <div className="pointer-events-auto w-full max-w-[430px] rounded-xl border border-border bg-background p-3 shadow-lg md:max-w-[768px]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Download className="size-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">
              Install SMH Control Panel
            </p>
            {deferred ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tambahkan ke layar utama agar lebih cepat dibuka.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ketuk{" "}
                <Share className="inline size-3.5 align-text-bottom" /> Share,
                lalu <span className="font-medium">Add to Home Screen</span>.
              </p>
            )}
            <div className="mt-2.5 flex gap-2">
              {deferred ? (
                <Button
                  size="sm"
                  className="h-8"
                  disabled={installing}
                  onClick={() => void install()}
                >
                  {installing ? "Memasang…" : "Install"}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={dismiss}
              >
                Nanti
              </Button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={dismiss}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
