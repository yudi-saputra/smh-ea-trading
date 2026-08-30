import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth-member";
import { prisma } from "@/lib/db";
import {
  MemberAccountCard,
  MemberAccountsEmpty,
} from "@/components/member/account-card";
import { MemberAutoRefresh } from "@/components/member/auto-refresh";
import {
  expiryStatus,
  formatExpiryYmdLabel,
  toExpiryDateInput,
} from "@/lib/expiry";
import { isTerminalOnline } from "@/lib/terminal-live";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Daftar Akun" };

export default async function MemberAccountPage() {
  const member = await getSessionMember();
  if (!member) redirect("/member/login");

  const terminals = await prisma.terminal.findMany({
    where: { ownerMemberId: member.id },
    include: { snapshot: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <MemberAutoRefresh everyMs={15000} />

      {terminals.length === 0 ? (
        <MemberAccountsEmpty className="rounded-2xl border border-border/80 bg-card" />
      ) : (
        <ul className="space-y-3">
          {terminals.map((t) => {
            const exp = expiryStatus(t.expiresAt);
            return (
              <li key={t.id}>
                <MemberAccountCard
                  account={{
                    id: t.id,
                    name: t.name,
                    terminalId: t.terminalId,
                    online: isTerminalOnline(t.lastSeenAt),
                    status: t.snapshot?.status ?? "—",
                    equity:
                      t.snapshot?.equity != null
                        ? String(t.snapshot.equity)
                        : null,
                    dailyPnl:
                      t.snapshot?.dailyPnl != null
                        ? String(t.snapshot.dailyPnl)
                        : null,
                    // en-CA (YYYY-MM-DD) is for admin sorting, not for members.
                    expiresLabel: formatExpiryYmdLabel(
                      toExpiryDateInput(t.expiresAt),
                    ),
                    expiryState: exp.label,
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
