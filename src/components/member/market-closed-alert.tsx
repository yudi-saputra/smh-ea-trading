"use client";

import { useEffect, useState } from "react";
import { CalendarOffIcon, XIcon } from "lucide-react";

const DISMISS_KEY = "smh:market-closed-dismissed";

/** Shown on Home when forex market is closed (weekend WIB). */
export function MarketClosedAlert() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(sessionStorage.getItem(DISMISS_KEY) !== "1");
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="relative flex gap-3 rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3.5 pr-11"
    >
      <CalendarOffIcon
        className="mt-0.5 size-5 shrink-0 text-orange-500"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="type-ui font-semibold text-orange-500">Market Closed</p>
        <p className="type-caption mt-0.5 leading-relaxed text-muted-foreground">
          EA tidak membuka posisi selama market close.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup alert"
        className="absolute right-2.5 top-2.5 inline-flex size-7 items-center justify-center rounded-lg text-orange-500/80 transition-colors hover:bg-orange-500/15 hover:text-orange-500"
      >
        <XIcon className="size-4" aria-hidden />
      </button>
    </div>
  );
}
