import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  CalculatorIcon,
} from "lucide-react";
import {
  getSessionMember,
} from "@/lib/auth-member";
import { prisma } from "@/lib/db";
import { expiryStatus } from "@/lib/expiry";
import { formatMoney, formatMoneySigned } from "@/lib/money";
import { whatsappLink } from "@/lib/contact";
import {
  isForexWeekendClosed,
  isTerminalOnline,
} from "@/lib/terminal-live";
import { MarketClosedAlert } from "@/components/member/market-closed-alert";
import { MemberAutoRefresh } from "@/components/member/auto-refresh";
import { MemberAccountsEmpty } from "@/components/member/account-card";
import { MemberHomeAccountRow } from "@/components/member/member-home-account-row";
import { MemberSummaryCard } from "@/components/member/summary-card";
import { HomeBanner } from "@/components/member/home-banner";
import { getHomeBannerConfig } from "@/lib/home-banners";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Beranda" };

export default async function MemberHomePage() {
  const member = await getSessionMember();
  if (!member) redirect("/member/login");

  const terminals = await prisma.terminal.findMany({
    where: { ownerMemberId: member.id },
    include: { snapshot: true },
    orderBy: { updatedAt: "desc" },
  });

  const eaOn = terminals.filter((t) => {
    if (!isTerminalOnline(t.lastSeenAt)) return false;
    const s = t.snapshot?.status?.toLowerCase();
    return s === "on" || s === "paused";
  }).length;
  const expiredCount = terminals.filter(
    (t) => expiryStatus(t.expiresAt).label === "expired",
  ).length;

  // Sum only reported figures; no EA report at all stays null, never 0.
  // Number(null) is 0, so missing values must be dropped before converting.
  const sumReported = (pick: (t: (typeof terminals)[number]) => unknown) => {
    const nums = terminals
      .map(pick)
      .filter((v) => v != null)
      .map(Number)
      .filter(Number.isFinite);
    return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
  };

  // Equity, not balance: it includes floating, and the rows below show equity.
  const totalEquity = sumReported((t) => t.snapshot?.equity);
  const totalPnl = sumReported((t) => t.snapshot?.dailyPnl);
  const growthPct =
    totalEquity != null && totalEquity > 0 && totalPnl != null
      ? (totalPnl / totalEquity) * 100
      : null;

  const displayName = member.name.trim() || member.email.split("@")[0] || "Member";
  const recent = terminals.slice(0, 3);
  const banner = await getHomeBannerConfig();

  const accountSummary =
    terminals.length === 0
      ? "Belum ada akun terdaftar."
      : [
          `${eaOn} dari ${terminals.length} akun aktif`,
          expiredCount > 0 ? `${expiredCount} kedaluwarsa` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="space-y-6">
      <MemberAutoRefresh everyMs={15000} />

      <div className="space-y-1">
        <h2 className="type-display">
          Halo, {displayName}
        </h2>
        <p className="type-ui text-muted-foreground">
          Ringkasan performa EA dari akun Anda.
        </p>
      </div>

      {isForexWeekendClosed() ? <MarketClosedAlert /> : null}

      <MemberSummaryCard
        equity={formatMoney(totalEquity)}
        pnl={formatMoneySigned(totalPnl)}
        pnlValue={totalPnl}
        growthPct={growthPct}
      />

      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="flex items-start justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <h3 className="type-ui font-semibold tracking-tight">
              Daftar Akun
            </h3>
            <p className="type-caption mt-0.5 text-muted-foreground">
              {accountSummary}
            </p>
          </div>
          {terminals.length > 0 ? (
            <Link
              href="/member/account"
              className="type-caption inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 font-medium transition-colors outline-none hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Lihat semua
              <ArrowRightIcon className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>

        {terminals.length === 0 ? (
          <MemberAccountsEmpty className="border-t border-border/60" />
        ) : (
          <ul>
            {recent.map((t) => {
              const equity =
                t.snapshot?.equity != null ? Number(t.snapshot.equity) : null;
              const dailyPnl =
                t.snapshot?.dailyPnl != null
                  ? Number(t.snapshot.dailyPnl)
                  : null;
              const expired = expiryStatus(t.expiresAt).label === "expired";

              return (
                <li key={t.id} className="border-t border-border/60">
                  <MemberHomeAccountRow
                    id={t.id}
                    terminalId={t.terminalId}
                    online={isTerminalOnline(t.lastSeenAt)}
                    status={t.snapshot?.status}
                    expired={expired}
                    equity={equity}
                    dailyPnl={dailyPnl}
                    href={`/member/account/${t.id}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        href="/member/tools/simulasi"
        className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 transition-colors outline-none hover:bg-accent/20 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-accent/30"
      >
        <div className="min-w-0 flex-1">
          <p className="type-ui font-medium">Simulasi Lot & Modal</p>
          <p className="type-caption mt-0.5 text-muted-foreground">
            Hitung perkiraan lot dan floating per layer.
          </p>
        </div>
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5"
          aria-hidden
        >
          <CalculatorIcon className="size-5 text-foreground" />
        </span>
      </Link>

      <HomeBanner slides={banner.slides} intervalSec={banner.intervalSec} />

      <Link
        href={whatsappLink(
          "Halo Admin SMH,\n\nSaya mengalami kendala pada EA SMH dan membutuhkan bantuan untuk pengecekan serta penyelesaiannya.\n\nMohon bantuannya. Terima kasih.",
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 transition-colors outline-none hover:bg-accent/20 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-accent/30"
      >
        <div className="min-w-0 flex-1">
          <p className="type-ui font-medium">Butuh Bantuan?</p>
          <p className="type-caption mt-0.5 text-muted-foreground">
            Support kami siap membantu Anda.
          </p>
        </div>
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-[#25D366]">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
