import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser, canAccessTerminals, getTerminalForUser } from "@/lib/auth";
import { AccountExpiryForm } from "@/components/admin/account/account-expiry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { expiryStatus, formatExpiryDate } from "@/lib/expiry";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getSessionUser();
  if (!user) return { title: "Akun" };
  const { id } = await params;
  const terminal = await getTerminalForUser(user, id);
  return { title: terminal?.name ?? "Akun" };
}

function isOnline(lastSeenAt: Date | null) {
  if (!lastSeenAt) return false;
  return Date.now() - lastSeenAt.getTime() < 30_000;
}

function statusTone(status: string | null | undefined) {
  const s = status?.toLowerCase();
  if (s === "on") return "text-trading-profit";
  if (s === "paused") return "text-trading-gold";
  return "text-muted-foreground";
}

function expiryTone(label: string) {
  if (label === "expired") return "text-trading-loss";
  if (label === "expiring") return "text-trading-gold";
  if (label === "active") return "text-trading-profit";
  return "text-muted-foreground";
}

export default async function AdminAccountDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!canAccessTerminals(user.role)) redirect("/admin/users");

  const { id } = await params;
  const terminal = await getTerminalForUser(user, id);
  if (!terminal) notFound();

  const snap = terminal.snapshot;
  const online = isOnline(terminal.lastSeenAt);
  const exp = expiryStatus(terminal.expiresAt);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{terminal.name}</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{terminal.terminalId}</span>
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "status-dot",
                online ? "status-dot-online" : "status-dot-offline",
              )}
              aria-hidden
            />
            <span className={online ? "text-trading-profit" : ""}>
              {online ? "online" : "offline"}
            </span>
          </span>
          <span>·</span>
          <span>{terminal.enabled ? "enabled" : "disabled"}</span>
          <span>·</span>
          <span className={expiryTone(exp.label)}>
            Exp: {formatExpiryDate(terminal.expiresAt)}
            {exp.label === "expired"
              ? " (expired)"
              : exp.label === "expiring"
                ? " (soon)"
                : ""}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              "text-2xl font-semibold uppercase tabular-nums",
              statusTone(snap?.status),
            )}
          >
            {snap?.status ?? "—"}
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="tabular-nums text-2xl font-semibold">
            {snap?.equity?.toString() ?? "—"}
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily PnL
            </CardTitle>
          </CardHeader>
          <CardContent className="tabular-nums text-2xl font-semibold">
            {snap?.floatPnl?.toString() ?? "—"}
          </CardContent>
        </Card>
      </div>

      {user.role === Role.SUPER_ADMIN ? (
        <Card className="panel-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <AccountExpiryForm
              terminalId={terminal.id}
              expiresAt={terminal.expiresAt?.toISOString() ?? null}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="panel-card">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-semibold">Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 pt-4 text-sm sm:grid-cols-2">
          <Row label="Symbol" value={snap?.symbol} />
          <Row label="ID Trading" value={snap?.account?.toString()} />
          <Row label="Balance" value={snap?.balance?.toString()} />
          <Row label="Positions" value={snap ? String(snap.positions) : null} />
          <Row label="BUY / SELL" value={snap ? `${snap.buy} / ${snap.sell}` : null} />
          <Row label="Daily PnL" value={snap?.dailyPnl?.toString()} />
          <Row label="Layer" value={snap?.layer?.toString()} />
          <Row
            label="Max lot / layer"
            value={
              snap ? `${snap.maxLot ?? "—"} / ${snap.maxLayer ?? "—"}` : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 rounded-md px-2 py-2 transition-colors hover:bg-accent/20">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value ?? "—"}</span>
    </div>
  );
}
