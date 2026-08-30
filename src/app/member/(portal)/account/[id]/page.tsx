import { notFound, redirect } from "next/navigation";
import {
  getSessionMember,
  getTerminalForMember,
} from "@/lib/auth-member";
import { MemberAccountControls } from "@/components/member/account-controls";
import { MemberAutoRefresh } from "@/components/member/auto-refresh";
import { EaLogs } from "@/components/member/ea-logs";
import { MemberAccountPowerSwitch } from "@/components/member/account-power-switch";
import { MemberAccountSettings } from "@/components/member/account-settings";
import { MemberAccountDetail } from "@/components/member/account-detail";
import { prisma } from "@/lib/db";
import {
  expiryStatus,
  formatExpiryYmdLabel,
  toExpiryDateInput,
} from "@/lib/expiry";
import { isTerminalOnline } from "@/lib/terminal-live";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Detail Akun" };

export default async function MemberAccountDetailPage({ params }: Props) {
  const member = await getSessionMember();
  if (!member) redirect("/member/login");
  const { id } = await params;
  const terminal = await getTerminalForMember(member, id);
  if (!terminal) notFound();

  const online = isTerminalOnline(terminal.lastSeenAt);
  const exp = expiryStatus(terminal.expiresAt);
  const expired = exp.label === "expired";

  const commands = await prisma.command.findMany({
    where: { terminalId: terminal.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const raw = terminal.snapshot;
  const hb =
    raw?.rawJson && typeof raw.rawJson === "object" && !Array.isArray(raw.rawJson)
      ? (raw.rawJson as Record<string, unknown>)
      : null;
  const hbNum = (key: string): string | null => {
    const v = hb?.[key];
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
    return String(v);
  };
  const hbInt = (key: string): number | null => {
    const v = hb?.[key];
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
    return Math.trunc(v);
  };
  const snap = raw
    ? {
        status: raw.status,
        symbol: raw.symbol,
        account: raw.account?.toString() ?? null,
        balance: raw.balance?.toString() ?? null,
        equity: raw.equity?.toString() ?? null,
        floatPnl: raw.floatPnl?.toString() ?? null,
        dailyPnl: raw.dailyPnl?.toString() ?? null,
        positions: raw.positions,
        buy: raw.buy,
        sell: raw.sell,
      }
    : null;

  const settings = (
    <MemberAccountSettings
      terminalId={terminal.id}
      enabled={terminal.enabled && online && !expired}
      values={{
        layer: raw?.layer?.toString() ?? null,
        multiplier: raw?.multiplier?.toString() ?? null,
        baseLot: hbNum("base_lot"),
        layersPerLot: hbInt("layers_per_lot"),
        lotIncrement: hbNum("lot_increment"),
        target: raw?.target?.toString() ?? null,
        cutloss: raw?.cutloss?.toString() ?? null,
        maxLot: raw?.maxLot?.toString() ?? null,
        maxLayer: raw?.maxLayer ?? null,
        tradeTime: raw?.tradeTime ?? null,
        tradeStartMin: raw?.tradeStartMin ?? null,
        tradeEndMin: raw?.tradeEndMin ?? null,
      }}
    />
  );

  return (
    <div className="space-y-5">
      <MemberAutoRefresh />

      <MemberAccountPowerSwitch
        terminalId={terminal.id}
        enabled={terminal.enabled}
        status={snap?.status}
        online={online}
        expired={expired}
      />

      <MemberAccountControls
        terminalId={terminal.id}
        enabled={terminal.enabled && online}
        expired={expired}
        status={online ? snap?.status : "off"}
        mode={raw?.mode}
        entryMode={raw?.entryMode}
        logs={
          <EaLogs
            logs={commands.map((c) => ({
              id: c.id,
              text: c.text,
              status: c.status,
              createdAt: c.createdAt.toISOString(),
              resultMessage: c.resultMessage,
            }))}
          />
        }
      />

      <MemberAccountDetail
        snap={snap}
        online={online}
        expired={expired}
        name={terminal.name}
        idTrading={terminal.terminalId}
        expiresLabel={formatExpiryYmdLabel(
          toExpiryDateInput(terminal.expiresAt),
        )}
        expiryState={exp.label}
        settings={settings}
        simHref={`/member/tools/simulasi?${new URLSearchParams({
          ...(raw?.layer != null ? { layer: String(raw.layer) } : {}),
          ...(raw?.multiplier != null
            ? { multiplier: String(raw.multiplier) }
            : {}),
          ...(hbNum("base_lot") ? { baseLot: hbNum("base_lot")! } : {}),
          ...(hbInt("layers_per_lot")
            ? { layersPer: String(hbInt("layers_per_lot")) }
            : {}),
          ...(hbNum("lot_increment")
            ? { lotInc: hbNum("lot_increment")! }
            : {}),
          ...(raw?.maxLot != null ? { maxLot: String(raw.maxLot) } : {}),
          ...(raw?.mode != null
            ? { mode: raw.mode === 1 ? "aggressive" : "conservative" }
            : {}),
        }).toString()}`}
      />
    </div>
  );
}
