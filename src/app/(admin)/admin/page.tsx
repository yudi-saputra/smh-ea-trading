import Link from "next/link";
import { redirect } from "next/navigation";
import { CommandStatus, Role } from "@prisma/client";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import {
  canAccessTerminals,
  getSessionUser,
  terminalOwnerFilter,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionCards } from "@/components/admin/layout/section-cards";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

function isOnline(lastSeenAt: Date | null) {
  if (!lastSeenAt) return false;
  return Date.now() - lastSeenAt.getTime() < 30_000;
}

function statusTone(status: string | null | undefined) {
  const s = status?.toLowerCase();
  if (s === "on") return "text-trading-profit";
  if (s === "paused") return "text-trading-gold";
  if (s === "off") return "text-muted-foreground";70
  return "text-muted-foreground";
}

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!canAccessTerminals(user.role)) redirect("/admin/users");

  const terminals = await prisma.terminal.findMany({
    where: terminalOwnerFilter(user),
    include: {
      snapshot: true,
      owner: { select: { email: true, displayName: true } },
      memberOwner: { select: { email: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const terminalIds = terminals.map((t) => t.id);
  const pendingCommands =
    terminalIds.length === 0
      ? 0
      : await prisma.command.count({
          where: {
            terminalId: { in: terminalIds },
            status: CommandStatus.PENDING,
          },
        });

  const online = terminals.filter((t) => isOnline(t.lastSeenAt)).length;
  const eaOn = terminals.filter((t) => {
    const s = t.snapshot?.status?.toLowerCase();
    return s === "on" || s === "paused";
  }).length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards
        stats={{
          totalTerminals: terminals.length,
          online,
          eaOn,
          pendingCommands,
        }}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-base font-medium">
              Recent terminals
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest activity across your fleet
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {terminals.length > 0 ? (
              <Link
                href="/admin/account"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <ArrowRightIcon className="size-3.5" />
              </Link>
            ) : null}
            <Link
              href="/admin/account"
              className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            >
              <PlusIcon className="size-4" />
              New terminal
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {terminals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50">
                <PlusIcon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No terminals yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Create a terminal and paste the ApiKey into SMH_Controller_v1.1
                </p>
              </div>
              <Link
                href="/admin/account"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Create terminal
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {terminals.slice(0, 8).map((t) => {
                const onlineNow = isOnline(t.lastSeenAt);
                const status = t.snapshot?.status ?? "—";
                return (
                  <li key={t.id}>
                    <Link
                      href={`/admin/account/${t.id}`}
                      className="group flex flex-wrap items-center justify-between gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "status-dot",
                            onlineNow
                              ? "status-dot-online"
                              : "status-dot-offline",
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium transition-colors group-hover:text-primary">
                            {t.name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {t.terminalId}
                            {user.role === Role.SUPER_ADMIN
                              ? ` · ${
                                  t.memberOwner?.name ??
                                  t.memberOwner?.email ??
                                  t.owner?.displayName ??
                                  t.owner?.email ??
                                  "—"
                                }`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right text-sm">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            EA Status
                          </p>
                          <p
                            className={cn(
                              "font-medium uppercase tabular-nums",
                              statusTone(t.snapshot?.status),
                            )}
                          >
                            {status}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Connection
                          </p>
                          <p
                            className={cn(
                              "font-medium capitalize",
                              onlineNow
                                ? "text-trading-profit"
                                : "text-muted-foreground",
                            )}
                          >
                            {onlineNow ? "online" : "offline"}
                          </p>
                        </div>
                        <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
