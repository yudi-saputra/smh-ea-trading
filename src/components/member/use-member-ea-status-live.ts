"use client";

import { useEffect, useState } from "react";
import { memberEaStatus } from "@/lib/ea-status";
import { readEaPowerPending } from "@/lib/ea-power-pending";

/** Merges session pending power with server snapshot for list/summary surfaces. */
export function useMemberEaStatusLive(
  terminalId: string,
  online: boolean,
  status: string | null | undefined,
  expired: boolean,
) {
  const [pending, setPending] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => {
      const p = readEaPowerPending(terminalId);
      setPending(p);
    };
    sync();
    window.addEventListener("smh:ea-power", sync);
    return () => window.removeEventListener("smh:ea-power", sync);
  }, [terminalId]);

  const effectiveStatus =
    pending === null ? status : pending ? "on" : "off";

  return memberEaStatus(online, effectiveStatus, expired);
}
