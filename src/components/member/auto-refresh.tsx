"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * EA figures are server-rendered but arrive by heartbeat, so the page has to
 * re-fetch itself or the numbers silently go stale.
 */
export function MemberAutoRefresh({ everyMs = 5000 }: { everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      // Background tabs would keep hitting the DB for nobody.
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs]);

  return null;
}
