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
      // #region agent log
      fetch('http://127.0.0.1:7448/ingest/5685db13-3f30-461e-a4ab-70f1f7f1f9d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5bc4d7'},body:JSON.stringify({sessionId:'5bc4d7',location:'use-member-ea-status-live.ts:sync',message:'pending sync',data:{terminalId,pending:p,status},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
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
