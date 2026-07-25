import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth-member";
import { prisma } from "@/lib/db";
import { MemberAccountCard } from "@/components/member/account-card";
import { expiryStatus, formatExpiryDate } from "@/lib/expiry";
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
      <div className="space-y-1">
        <h2 className="type-display">Daftar Akun</h2>
        <p className="type-ui text-muted-foreground">
          Pantau status dan performa EA Anda secara Real Time
        </p>
      </div>

      {terminals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center">
          <p className="type-ui font-medium">Belum ada akun</p>
          <p className="type-caption mt-1 text-muted-foreground">
            Hubungi admin untuk menambahkan akun ke profil Anda.
          </p>
        </div>
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
                    balance:
                      t.snapshot?.balance != null
                        ? String(t.snapshot.balance)
                        : null,
                    dailyPnl:
                      t.snapshot?.dailyPnl != null
                        ? String(t.snapshot.dailyPnl)
                        : null,
                    expiresLabel: formatExpiryDate(t.expiresAt),
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
