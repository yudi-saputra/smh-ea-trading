"use client";

import { cn } from "@/lib/utils";
import { useMemberEaStatusLive } from "@/components/member/use-member-ea-status-live";

export function MemberEaStatusBadge({
  terminalId,
  online,
  status,
  expired,
  className,
}: {
  terminalId: string;
  online: boolean;
  status: string | null | undefined;
  expired: boolean;
  className?: string;
}) {
  const ea = useMemberEaStatusLive(terminalId, online, status, expired);

  return (
    <span className={cn("type-label shrink-0 rounded-full px-2 py-1", ea.pill, className)}>
      {ea.label}
    </span>
  );
}
