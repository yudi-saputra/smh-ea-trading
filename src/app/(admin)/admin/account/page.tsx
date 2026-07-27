import { redirect } from "next/navigation";
import { Role, MemberStatus } from "@prisma/client";
import { AccountsTable, type AccountRow } from "@/components/admin/tables/accounts-table";
import {
  canCreateTerminal,
  canViewAccounts,
  getSessionUser,
  terminalOwnerFilter,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptApiKey } from "@/lib/crypto";
import { formatExpiryDate, expiryStatus } from "@/lib/expiry";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account EA" };

function isOnline(lastSeenAt: Date | null) {
  if (!lastSeenAt) return false;
  return Date.now() - lastSeenAt.getTime() < 30_000;
}

export default async function AdminAccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!canViewAccounts(user.role)) redirect("/admin/users");

  const canCreate = canCreateTerminal(user.role);
  const showApiKey = user.role === Role.SUPER_ADMIN;
  const canMutate = user.role === Role.SUPER_ADMIN;

  const [terminals, members] = await Promise.all([
    prisma.terminal.findMany({
      where: terminalOwnerFilter(user),
      include: {
        snapshot: true,
        owner: { select: { email: true, displayName: true } },
        memberOwner: {
          select: {
            email: true,
            name: true,
            passwordTrading: true,
            serverBroker: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    canCreate
      ? prisma.member.findMany({
          where: { status: MemberStatus.ACTIVE },
          select: {
            id: true,
            email: true,
            name: true,
            idTrading: true,
            serverBroker: true,
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const rows: AccountRow[] = terminals.map((t) => ({
    id: t.id,
    terminalId: t.terminalId,
    name: t.name,
    online: isOnline(t.lastSeenAt),
    eaStatus: t.snapshot?.status ?? "—",
    apiKey: showApiKey ? decryptApiKey(t.apiKeyEnc) : null,
    ownerEmail: t.memberOwner?.email ?? t.owner?.email ?? "—",
    ownerName: t.memberOwner?.name ?? t.owner?.displayName ?? null,
    passwordTrading: t.memberOwner?.passwordTrading ?? null,
    serverBroker: t.memberOwner?.serverBroker ?? null,
    expiry: formatExpiryDate(t.expiresAt),
    expiryLabel: expiryStatus(t.expiresAt).label,
    expiresAt: t.expiresAt?.toISOString() ?? null,
  }));

  const traders = members.map((m) => ({
    id: m.id,
    email: m.email,
    displayName: m.name,
    idTrading: m.idTrading,
    serverBroker: m.serverBroker,
  }));

  return (
    <AccountsTable
      header={
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">EA Account</h2>
          <p className="text-sm text-muted-foreground">
            {canMutate
              ? "Daftar Account EA yang terhubung dengan member."
              : "Daftar Account EA yang terhubung dengan member."}
          </p>
        </div>
      }
      rows={rows}
      showOwner={user.role === Role.SUPER_ADMIN}
      showApiKey={showApiKey}
      canMutate={canMutate}
      canCreate={canCreate}
      canGenerateApiKey={showApiKey}
      traders={traders}
    />
  );
}
