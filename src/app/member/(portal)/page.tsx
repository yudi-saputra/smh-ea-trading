import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  MonitorSmartphoneIcon,
  ZapIcon,
} from "lucide-react";
import {
  getSessionMember,
} from "@/lib/auth-member";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  isForexWeekendClosed,
  isTerminalOnline,
} from "@/lib/terminal-live";
import { MarketClosedAlert } from "@/components/member/market-closed-alert";
import { BalanceCard } from "@/components/member/balance-card";
import { HomeBanner } from "@/components/member/home-banner";
import { getHomeBannerConfig } from "@/lib/home-banners";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

function formatNum(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function pnlTone(value: number | null | undefined) {
  if (value == null || value === 0 || Number.isNaN(value)) {
    return "text-muted-foreground";
  }
  return value > 0 ? "text-trading-profit" : "text-trading-loss";
}

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

  const totalBalance = terminals.reduce((sum, t) => {
    const n = t.snapshot?.balance != null ? Number(t.snapshot.balance) : NaN;
    return Number.isNaN(n) ? sum : sum + n;
  }, 0);
  const totalPnl = terminals.reduce((sum, t) => {
    const n = t.snapshot?.dailyPnl != null ? Number(t.snapshot.dailyPnl) : NaN;
    return Number.isNaN(n) ? sum : sum + n;
  }, 0);
  const hasSnapshot = terminals.some((t) => t.snapshot != null);
  const growthPct =
    hasSnapshot && totalBalance > 0 ? (totalPnl / totalBalance) * 100 : null;

  const displayName = member.name.trim() || member.email.split("@")[0] || "Member";
  const recent = terminals.slice(0, 3);
  const banner = await getHomeBannerConfig();

  const stats = [
    {
      label: "Total Akun",
      value: terminals.length,
      icon: MonitorSmartphoneIcon,
    },
    {
      label: "Akun Aktif",
      value: eaOn,
      icon: ZapIcon,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="type-display">
          Hallo, {displayName}
        </h2>
        <p className="type-ui text-muted-foreground">
          Ringkasan performa EA dari akun anda.
        </p>
      </div>

      {isForexWeekendClosed() ? <MarketClosedAlert /> : null}

      <div className="space-y-4">
        <BalanceCard
          name={displayName}
          balance={hasSnapshot ? formatNum(totalBalance) : "0"}
          pnl={hasSnapshot ? formatNum(totalPnl) : "0"}
          pnlValue={hasSnapshot ? totalPnl : 0}
          growthPct={growthPct}
        />

        <div className="relative z-10 grid grid-cols-2 gap-2.5">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-border/80 bg-linear-to-t from-primary/5 to-card px-3.5 py-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="type-label tracking-[0.12em] text-muted-foreground">
                    {item.label}
                  </p>
                  <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight md:text-3xl">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="type-ui font-semibold tracking-tight">
              Daftar Akun
            </h3>
            <p className="type-caption mt-0.5 text-muted-foreground">
              Akun terbaru Anda.
            </p>
          </div>
          {terminals.length > 0 ? (
            <Link
              href="/member/account"
              className="type-caption inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 font-medium transition-colors hover:bg-accent/40"
            >
              Lihat semua
              <ArrowRightIcon className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>

        {terminals.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-card px-4 py-10 text-center">
            <p className="type-ui font-medium">Belum ada akun</p>
            <p className="type-caption mt-1 text-muted-foreground">
              Hubungi admin untuk menambahkan akun ke profil Anda.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border/80 bg-card">
            {recent.map((t, index) => {
              const equity =
                t.snapshot?.equity != null ? Number(t.snapshot.equity) : null;
              const dailyPnl =
                t.snapshot?.dailyPnl != null
                  ? Number(t.snapshot.dailyPnl)
                  : null;

              return (
                <li
                  key={t.id}
                  className={cn(index > 0 && "border-t border-border/60")}
                >
                  <Link
                    href={`/member/account/${t.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-accent/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="type-ui truncate font-semibold tracking-tight">
                        {t.name}
                      </p>
                      <p className="type-caption mt-0.5 truncate font-mono text-muted-foreground">
                        {t.terminalId}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="type-ui font-semibold tabular-nums tracking-tight">
                        {formatNum(equity)}
                      </p>
                      <p
                        className={cn(
                          "type-caption mt-0.5 tabular-nums",
                          pnlTone(dailyPnl),
                        )}
                      >
                        PnL {formatNum(dailyPnl)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <HomeBanner slides={banner.slides} intervalSec={banner.intervalSec} />

      <Link
        href="https://wa.me/6285691418661?text=Halo%20Admin%20SMH,%0A%0ASaya%20mengalami%20kendala%20pada%20EA%20SMH%20dan%20membutuhkan%20bantuan%20untuk%20pengecekan%20serta%20penyelesaiannya.%0A%0AMohon%20bantuannya.%20Terima%20kasih."
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 active:bg-accent/30"
      >
        <div className="min-w-0 flex-1">
          <p className="type-ui font-medium">Butuh Bantuan?</p>
          <p className="type-caption mt-0.5 text-muted-foreground">
            Support kami siap membantu anda.
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
