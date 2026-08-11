import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  Layers,
  Scale,
  CircleDollarSign,
  Target,
  AppWindow,
  ShieldCheck,
  Menu,
  Check,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Smart Martingale Hedging",
  description:
    "Robot EA trading MetaTrader 5 untuk XAUUSD dengan hedging system otomatis.",
};

export default function PublicHomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-background font-sans selection:bg-trading-gold/20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll-left 34s linear infinite; }
        .eyebrow::before { content: ""; width: 6px; height: 6px; background: var(--trading-gold); border-radius: 50%; display: inline-block; }
        .zone-bracket::before, .zone-bracket::after { content: ""; width: 10px; height: 10px; border: 1.5px solid var(--trading-gold); }
        .zone-bracket::before { border-right: none; border-bottom: none; }
        .zone-bracket::after { border-left: none; border-top: none; }
        #menu-check:checked ~ * .mobile-panel { display: flex; }
        @media (min-width: 768px) {
          #menu-check:checked ~ * .mobile-panel { display: none; }
        }
      `,
        }}
      />

      {/* Background pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--trading-gold)_6%,transparent)_1px,transparent_0)]"
        style={{ backgroundSize: "34px 34px" }}
      />

      <input type="checkbox" id="menu-check" className="peer hidden" />

      {/* Ticker */}
      <div className="relative z-10 border-b border-border bg-[#080a0e] py-2 overflow-hidden whitespace-nowrap">
        <div className="animate-scroll inline-flex">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="inline-flex font-mono text-[11px] sm:text-xs text-muted-foreground"
            >
              <span className="border-r border-border/50 px-4 sm:px-6">
                XAUUSD &nbsp;2,382.40&nbsp;{" "}
                <b className="text-trading-profit font-semibold">▲ 0.42%</b>
              </span>
              <span className="border-r border-border/50 px-4 sm:px-6">
                ROBOT: AKTIF
              </span>
              <span className="border-r border-border/50 px-4 sm:px-6">
                MODE: AMAN
              </span>
              <span className="border-r border-border/50 px-4 sm:px-6">
                POSISI PENYEIMBANG: SIAGA
              </span>
              <span className="border-r border-border/50 px-4 sm:px-6">
                AMBIL PROFIT: OTOMATIS
              </span>
              <span className="border-r border-border/50 px-4 sm:px-6">
                BATAS RUGI HARIAN: BELUM TERSENTUH
              </span>
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-bold text-base tracking-tight sm:gap-2.5 sm:text-lg"
          >
            <img
              src="/logo_smh.png"
              alt="Logo"
              className="h-6 w-auto shrink-0 object-contain sm:h-7"
            />
            <span className="truncate">
              <span className="sm:hidden">SMH EA</span>
              <span className="hidden sm:inline">Smart Martingale Hedging</span>
            </span>
          </Link>
          <nav className="hidden md:flex gap-6 lg:gap-8 text-sm text-muted-foreground">
            <Link
              href="#cara-kerja"
              className="hover:text-trading-gold transition-colors"
            >
              Cara Kerja
            </Link>
            <Link
              href="#modul"
              className="hover:text-trading-gold transition-colors"
            >
              Modul
            </Link>
            <Link
              href="#untuk-siapa"
              className="hover:text-trading-gold transition-colors"
            >
              Untuk Siapa
            </Link>
            <Link
              href="#harga"
              className="hover:text-trading-gold transition-colors"
            >
              Paket & Harga
            </Link>
            <Link
              href="#faq"
              className="hover:text-trading-gold transition-colors"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              asChild
              className="bg-trading-gold text-background hover:bg-trading-gold/90 font-semibold hidden sm:inline-flex h-10 px-5"
            >
              <Link href="/member/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-trading-gold text-background hover:bg-trading-gold/90 font-semibold hidden sm:inline-flex h-10 px-5"
            >
              <Link href="/member/register">Daftar</Link>
            </Button>
            <Button asChild variant="outline" size="icon" className="md:hidden">
              <label htmlFor="menu-check" className="cursor-pointer">
                <Menu className="size-4" />
                <span className="sr-only">Menu</span>
              </label>
            </Button>
          </div>
        </div>
        <div className="mobile-panel hidden flex-col border-t border-border bg-background px-4 py-3 sm:px-6">
          <Link
            href="#cara-kerja"
            className="border-b border-border/50 py-3 text-base text-muted-foreground"
          >
            Cara Kerja
          </Link>
          <Link
            href="#modul"
            className="border-b border-border/50 py-3 text-base text-muted-foreground"
          >
            Modul
          </Link>
          <Link
            href="#untuk-siapa"
            className="border-b border-border/50 py-3 text-base text-muted-foreground"
          >
            Untuk Siapa
          </Link>
          <Link
            href="#harga"
            className="border-b border-border/50 py-3 text-base text-muted-foreground"
          >
            Paket & Harga
          </Link>
          <Link
            href="#faq"
            className="border-b border-border/50 py-3 text-base text-muted-foreground"
          >
            FAQ
          </Link>
          <div className="mt-3 flex flex-col gap-2 sm:hidden">
            <Button
              asChild
              className="w-full bg-trading-gold text-background hover:bg-trading-gold/90 font-semibold"
            >
              <Link href="/member/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full font-semibold">
              <Link href="/member/register">Daftar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* HERO */}
        <section className="py-10 sm:py-14 md:py-20">
          <div className="mx-auto grid max-w-[1180px] gap-8 px-4 sm:gap-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-12 lg:gap-14">
            <div className="min-w-0">
              <span className="eyebrow inline-flex items-center gap-2 font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-trading-gold">
                SMH EA Control
              </span>
              <h1 className="mt-4 mb-5 text-[1.75rem] font-semibold leading-[1.2] tracking-tight min-[400px]:text-[2rem] sm:mt-5 sm:mb-6 sm:text-4xl md:text-[44px] lg:text-[50px] lg:leading-[1.15]">
                Robot EA Trading Otomatis dengan eksekusi{" "}
                <em className="not-italic text-[#e8c874]">presisi</em>, dan
                proteksi{" "}
                <em className="not-italic text-[#e8c874]">risiko</em> terukur.
              </h1>
              <p className="mb-7 max-w-[480px] text-[15px] leading-relaxed text-muted-foreground sm:mb-8 sm:text-[16.5px]">
                SMH EA Control merupakan Expert Advisor (EA) MetaTrader 5 yang
                mengotomatisasi eksekusi strategi Martingale dan Hedging secara
                cerdas. Dilengkapi sistem manajemen risiko tingkat lanjut dengan
                batasan kerugian harian terpadu guna menjaga keamanan ekuitas
                Anda.
              </p>
              <div className="mb-8 flex w-full flex-col gap-3 sm:mb-10 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3.5">
                <Button
                  asChild
                  className="bg-trading-gold text-background hover:bg-trading-gold/90 h-11 w-full px-6 font-semibold sm:w-auto"
                >
                  <Link href="#harga">Coba Trial Gratis</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full px-6 font-semibold hover:border-trading-gold hover:text-[#e8c874] sm:w-auto"
                >
                  <Link href="#cara-kerja">Lihat Cara Kerja &rarr;</Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-3 min-[400px]:gap-3 sm:flex sm:flex-wrap sm:gap-7">
                <div className="border-l-2 border-border pl-3 font-mono text-xs text-muted-foreground/80">
                  <b className="mb-1 block font-sans text-sm font-bold text-foreground">
                    Otomatis Penuh
                  </b>
                  Jalan sendiri 24/5
                </div>
                <div className="border-l-2 border-border pl-3 font-mono text-xs text-muted-foreground/80">
                  <b className="mb-1 block font-sans text-sm font-bold text-foreground">
                    Ada Batas Rugi
                  </b>
                  Berhenti sesuai aturan
                </div>
                <div className="border-l-2 border-border pl-3 font-mono text-xs text-muted-foreground/80">
                  <b className="mb-1 block font-sans text-sm font-bold text-foreground">
                    Aman Dipakai
                  </b>
                  Terkunci per akun
                </div>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card px-4 py-6 sm:max-w-none sm:p-8 md:p-10 md:pb-8">
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-2.5 py-1 backdrop-blur sm:right-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-1.5">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground sm:text-[10.5px]">
                  ENGINE AKTIF
                </span>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trading-profit opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-trading-profit"></span>
                </span>
              </div>

              <div className="relative my-5 flex size-[130px] items-center justify-center sm:my-7 sm:size-[160px] md:my-8 md:size-[180px]">
                <div className="absolute size-[130px] animate-[spin_10s_linear_infinite] rounded-full border border-border sm:size-[160px] md:size-[180px]"></div>
                <div className="absolute size-[96px] animate-[spin_8s_linear_infinite_reverse] rounded-full border border-trading-gold/30 sm:size-[118px] md:size-[132px]"></div>
                <Bot className="relative z-10 size-[56px] text-[#e8c874] stroke-[1.3] sm:size-[68px] md:size-[78px]" />
              </div>

              <div className="mt-2 flex w-full min-w-0 flex-col border-t border-border sm:mt-4">
                <div className="flex items-baseline justify-between gap-3 border-b border-border/50 px-0.5 py-2.5 sm:px-1 sm:py-3">
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground sm:text-xs">
                    Symbol
                  </span>
                  <b className="min-w-0 text-right text-[13px] font-bold sm:text-[13.5px]">
                    XAUUSD
                  </b>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-border/50 px-0.5 py-2.5 sm:px-1 sm:py-3">
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground sm:text-xs">
                    Mode
                  </span>
                  <b className="min-w-0 text-right text-[13px] font-bold sm:text-[13.5px]">
                    Martingale + Hedging
                  </b>
                </div>
                <div className="flex items-baseline justify-between gap-3 px-0.5 py-2.5 sm:px-1 sm:py-3">
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground sm:text-xs">
                    Kontrol
                  </span>
                  <b className="min-w-0 text-right text-[13px] font-bold sm:text-[13.5px]">
                    Panel On-Chart
                  </b>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAIN POINTS */}
        <section className="bg-muted/30 py-14 sm:py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <div className="mb-8 max-w-[640px] sm:mb-12">
              <span className="eyebrow inline-flex items-center gap-2 font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-trading-gold">
                Masalah
              </span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Kalau dikerjakan manual, biasanya begini:
              </h2>
              <p className="mt-3 text-[14.5px] text-muted-foreground sm:mt-4 sm:text-[15.5px]">
                Strateginya sebenarnya sudah benar. Masalahnya ada di eksekusi
                manusia — capek, telat, atau kepanikan.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-trading-gold/40 hover:shadow-lg hover:shadow-trading-gold/5 sm:p-6 group">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-trading-loss">
                  Salah Hitung
                </span>
                <h3 className="mt-3 mb-2.5 text-base font-semibold leading-snug sm:text-lg">
                  Ukuran lot dihitung manual, rawan keliru.
                </h3>
                <p className="text-[14px] text-muted-foreground sm:text-[14.5px]">
                  Salah sedikit saat nambah posisi, total risiko bisa jadi jauh
                  lebih besar dari rencana.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-trading-gold/40 hover:shadow-lg hover:shadow-trading-gold/5 sm:p-6 group">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-trading-loss">
                  Lupa Berhenti
                </span>
                <h3 className="mt-3 mb-2.5 text-base font-semibold leading-snug sm:text-lg">
                  Batas rugi harian cuma niat, bukan aturan.
                </h3>
                <p className="text-[14px] text-muted-foreground sm:text-[14.5px]">
                  Sudah niat berhenti di batas tertentu, tapi pas kejadian
                  nyata, batas itu sering dilanggar sendiri.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-trading-gold/40 hover:shadow-lg hover:shadow-trading-gold/5 sm:p-6 group">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-trading-loss">
                  Telat Buka Hedge
                </span>
                <h3 className="mt-3 mb-2.5 text-base font-semibold leading-snug sm:text-lg">
                  Posisi penyeimbang dibuka kelamaan.
                </h3>
                <p className="text-[14px] text-muted-foreground sm:text-[14.5px]">
                  Saat harga sudah bergerak jauh, posisi lawan arah yang dibuka
                  manual jadi kurang efektif.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CARA KERJA */}
        <section id="cara-kerja" className="scroll-mt-20 py-14 sm:py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <div className="mb-8 max-w-[640px] sm:mb-12">
              <span className="eyebrow inline-flex items-center gap-2 font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-trading-gold">
                Cara Kerja
              </span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Simpel — empat langkah otomatis.
              </h2>
            </div>
            <div className="grid overflow-hidden rounded-2xl border border-border sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative border-b border-border bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:p-8 sm:border-r lg:border-b-0">
                <span className="mb-3 block font-mono text-xs font-semibold text-trading-gold sm:mb-4">
                  01
                </span>
                <h3 className="mb-2 text-base font-semibold sm:mb-2.5">
                  Buka Posisi
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  EA membuka posisi pertama secara otomatis sesuai pengaturan
                  lot dasar.
                </p>
              </div>
              <div className="relative border-b border-border bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:p-8 lg:border-b-0 lg:border-r">
                <span className="mb-3 block font-mono text-xs font-semibold text-trading-gold sm:mb-4">
                  02
                </span>
                <h3 className="mb-2 text-base font-semibold sm:mb-2.5">
                  Tambah Posisi Bertahap
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  Kalau harga melawan, EA menambah posisi bertahap dan
                  terkontrol — bukan asal gandakan lot.
                </p>
              </div>
              <div className="relative border-b border-border bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:border-r sm:p-8 sm:border-b-0 lg:border-b-0">
                <span className="mb-3 block font-mono text-xs font-semibold text-trading-gold sm:mb-4">
                  03
                </span>
                <h3 className="mb-2 text-base font-semibold sm:mb-2.5">
                  Buka Posisi Penyeimbang
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  Saat perlu, EA membuka posisi lawan arah (hedge) untuk
                  membantu menyeimbangkan kerugian sementara.
                </p>
              </div>
              <div className="relative bg-card p-6 transition-colors duration-300 hover:bg-muted/50 sm:p-8">
                <span className="mb-3 block font-mono text-xs font-semibold text-trading-gold sm:mb-4">
                  04
                </span>
                <h3 className="mb-2 text-base font-semibold sm:mb-2.5">
                  Tutup di Profit
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  Semua posisi dikelola bareng, lalu ditutup otomatis begitu
                  target profit tercapai.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MODUL / FITUR */}
        <section id="modul" className="scroll-mt-20 bg-muted/30 py-14 sm:py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <div className="mb-8 max-w-[640px] sm:mb-12">
              <span className="eyebrow zone-bracket inline-flex items-center gap-2 px-2 font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-trading-gold">
                Fitur
              </span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Apa saja yang ada di dalamnya.
              </h2>
              <p className="mt-3 text-[14.5px] text-muted-foreground sm:mt-4 sm:text-[15.5px]">
                Semua fitur ini dipakai langsung tiap hari, bukan sekadar
                tempelan.
              </p>
            </div>
            <div className="grid gap-[1px] overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-card p-5 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold">
                  <Layers className="size-5" />
                </div>
                <span className="mb-1 block font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
                  2 PILIHAN MODE
                </span>
                <h3 className="mb-2.5 text-base font-semibold sm:text-[16.5px]">
                  Mode Aman & Cepat
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pilih sendiri seberapa besar posisi tambahan dibuka — lebih
                  pelan atau lebih agresif.
                </p>
              </div>
              <div className="bg-card p-5 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold">
                  <Scale className="size-5" />
                </div>
                <span className="mb-1 block font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
                  HEDGING
                </span>
                <h3 className="mb-2.5 text-base font-semibold sm:text-[16.5px]">
                  Posisi Penyeimbang Otomatis
                </h3>
                <p className="text-sm text-muted-foreground">
                  EA bisa membuka posisi lawan arah sendiri untuk membantu
                  menahan kerugian sementara.
                </p>
              </div>
              <div className="bg-card p-5 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold">
                  <CircleDollarSign className="size-5" />
                </div>
                <span className="mb-1 block font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
                  BATAS RUGI
                </span>
                <h3 className="mb-2.5 text-base font-semibold sm:text-[16.5px]">
                  Target & Batas Rugi Harian
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cukup atur angka dalam dolar — EA berhenti sendiri kalau
                  target atau batas sudah tercapai.
                </p>
              </div>
              <div className="bg-card p-5 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold">
                  <Target className="size-5" />
                </div>
                <span className="mb-1 block font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
                  TP OTOMATIS
                </span>
                <h3 className="mb-2.5 text-base font-semibold sm:text-[16.5px]">
                  Ambil Profit Bertahap
                </h3>
                <p className="text-sm text-muted-foreground">
                  Garis take profit mengikuti pergerakan harga, jadi profit bisa
                  diamankan lebih optimal.
                </p>
              </div>
              <div className="bg-card p-5 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold">
                  <AppWindow className="size-5" />
                </div>
                <span className="mb-1 block font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
                  MUDAH DIPAKAI
                </span>
                <h3 className="mb-2.5 text-base font-semibold sm:text-[16.5px]">
                  Panel Kontrol di Chart
                </h3>
                <p className="text-sm text-muted-foreground">
                  Semua tombol dan pengaturan ada langsung di chart — tidak
                  perlu aplikasi tambahan.
                </p>
              </div>
              <div className="bg-card p-5 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold">
                  <ShieldCheck className="size-5" />
                </div>
                <span className="mb-1 block font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
                  AMAN
                </span>
                <h3 className="mb-2.5 text-base font-semibold sm:text-[16.5px]">
                  Versi Trial Terkunci
                </h3>
                <p className="text-sm text-muted-foreground">
                  Versi coba gratis dikunci ke satu akun dan ada batas waktunya,
                  jadi aman untuk dibagikan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* UNTUK SIAPA */}
        <section id="untuk-siapa" className="scroll-mt-20 py-14 sm:py-20 md:py-24">
          <div className="mx-auto grid max-w-[1180px] gap-8 px-4 sm:gap-10 sm:px-6 md:grid-cols-2 md:items-start">
            <div className="min-w-0">
              <span className="eyebrow inline-flex items-center gap-2 font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-trading-gold">
                Untuk Siapa
              </span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Cocok untuk siapa EA ini?
              </h2>
              <p className="mt-3 text-[14.5px] text-muted-foreground sm:mt-4 sm:text-[15px]">
                SMH EA bukan strategi &quot;bebas risiko&quot;. Cocok dipakai
                kalau kamu sudah paham cara kerja martingale dan hedging secara
                umum, dan mau eksekusinya berjalan konsisten tanpa capek mantau
                terus.
              </p>
            </div>
            <ul className="flex min-w-0 flex-col">
              <li className="flex gap-3 border-b border-border/50 py-3.5 text-[14.5px] text-muted-foreground sm:text-[15px]">
                <span className="text-trading-gold flex-shrink-0">—</span>{" "}
                <span>
                  <b className="font-semibold text-foreground">
                    Trading XAUUSD (Gold)
                  </b>{" "}
                  — fokus dan diuji khusus untuk pair ini.
                </span>
              </li>
              <li className="flex gap-3 border-b border-border/50 py-3.5 text-[14.5px] text-muted-foreground sm:text-[15px]">
                <span className="text-trading-gold flex-shrink-0">—</span>{" "}
                <span>
                  <b className="font-semibold text-foreground">
                    Sudah paham risikonya
                  </b>{" "}
                  — tahu bahwa menambah posisi berarti risiko juga bisa
                  membesar.
                </span>
              </li>
              <li className="flex gap-3 border-b border-border/50 py-3.5 text-[14.5px] text-muted-foreground sm:text-[15px]">
                <span className="text-trading-gold flex-shrink-0">—</span>{" "}
                <span>
                  <b className="font-semibold text-foreground">Pakai VPS</b> —
                  supaya EA jalan terus 24/5 tanpa tergantung laptop menyala.
                </span>
              </li>
              <li className="flex gap-3 border-b border-border/50 py-3.5 text-[14.5px] text-muted-foreground sm:text-[15px]">
                <span className="text-trading-gold flex-shrink-0">—</span>{" "}
                <span>
                  <b className="font-semibold text-foreground">
                    Developer & reseller EA
                  </b>{" "}
                  — butuh lisensi yang bisa dibagikan aman ke klien.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* HARGA / PAKET */}
        <section id="harga" className="scroll-mt-20 bg-muted/30 py-14 sm:py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <div className="mb-8 max-w-[640px] sm:mb-12">
              <span className="eyebrow inline-flex items-center gap-2 font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-trading-gold">
                Paket & Harga
              </span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Tiga paket, dari uji coba sampai reseller.
              </h2>
              <p className="mt-3 text-[14.5px] text-muted-foreground sm:mt-4 sm:text-[15.5px]">
                Semua paket menjalankan mesin martingale & hedging yang sama —
                bedanya di masa aktif, jumlah akun, dan dukungan.
              </p>
            </div>
            <div className="grid gap-5 sm:gap-6 md:grid-cols-3 md:items-stretch">
              <div className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-trading-gold/40 hover:shadow-lg hover:shadow-trading-gold/5 sm:p-7">
                <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-trading-gold">
                  Trial
                </span>
                <h3 className="mt-3 mb-1.5 text-2xl font-semibold">Gratis</h3>
                <p className="mb-5 min-h-0 text-[13px] text-muted-foreground sm:mb-6 sm:min-h-[34px]">
                  Masa aktif terbatas, terkunci ke satu akun
                </p>
                <ul className="mb-6 flex-1 flex flex-col">
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground first:border-0 sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Mesin martingale & hedging penuh
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Trailing TP dua tingkat
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Panel kontrol on-chart
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Target & batas rugi harian (USD)
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground/40 sm:text-[13.8px]">
                    <Minus className="mt-0.5 size-4 flex-shrink-0" /> Mode Cepat
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground/40 sm:text-[13.8px]">
                    <Minus className="mt-0.5 size-4 flex-shrink-0" /> Dukungan
                    pemasangan VPS
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground/40 sm:text-[13.8px]">
                    <Minus className="mt-0.5 size-4 flex-shrink-0" /> Multi-akun
                  </li>
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-center"
                >
                  <Link href="/member/register">Ajukan Trial</Link>
                </Button>
              </div>

              <div className="relative flex flex-col rounded-2xl border border-trading-gold bg-gradient-to-b from-trading-gold/10 to-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-trading-gold/10 sm:p-7 md:-translate-y-2 md:hover:-translate-y-3">
                <span className="absolute -top-[1px] right-4 rounded-b-md bg-trading-gold px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-background sm:right-5">
                  Paling Populer
                </span>
                <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-trading-gold">
                  Single License
                </span>
                <h3 className="mt-3 mb-1.5 text-2xl font-semibold">
                  Paket Elit
                </h3>
                <p className="mb-5 min-h-0 text-[13px] text-muted-foreground sm:mb-6 sm:min-h-[34px]">
                  1 akun live, tanpa batas masa aktif
                </p>
                <ul className="mb-6 flex-1 flex flex-col">
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground first:border-0 sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Mesin martingale & hedging penuh
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Mode Aman & Mode Cepat
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Trailing TP dua tingkat
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Target & batas rugi harian (USD)
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Panel kontrol on-chart
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Dukungan pemasangan di VPS
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground/40 sm:text-[13.8px]">
                    <Minus className="mt-0.5 size-4 flex-shrink-0" /> Multi-akun
                  </li>
                </ul>
                <Button
                  asChild
                  className="w-full justify-center bg-trading-gold text-background hover:bg-trading-gold/90 font-semibold"
                >
                  <Link href="/member/register">Pesan Sekarang</Link>
                </Button>
              </div>

              <div className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-trading-gold/40 hover:shadow-lg hover:shadow-trading-gold/5 sm:p-7">
                <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-trading-gold">
                  Multi Akun / Lisensi
                </span>
                <h3 className="mt-3 mb-1.5 text-2xl font-semibold">
                  Paket Ultimate
                </h3>
                <p className="mb-5 min-h-0 text-[13px] text-muted-foreground sm:mb-6 sm:min-h-[34px]">
                  Untuk Affiliate & Reseller
                </p>
                <ul className="mb-6 flex-1 flex flex-col">
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground first:border-0 sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Semua fitur Single License
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Lisensi untuk banyak akun/klien
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Proteksi trial per-klien
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Prioritas dukungan teknis
                  </li>
                  <li className="flex items-start gap-2.5 border-t border-border/50 py-2.5 text-[13.5px] text-muted-foreground sm:text-[13.8px]">
                    <Check className="mt-0.5 size-4 flex-shrink-0 text-trading-profit" />{" "}
                    Skema harga per volume
                  </li>
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-center"
                >
                  <Link href="/member/register">Hubungi Admin</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-14 sm:py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <div className="mb-8 max-w-[640px] sm:mb-12">
              <h2 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
                Pertanyaan yang sering masuk (FAQ).
              </h2>
            </div>
            <div className="max-w-[760px] flex flex-col divide-y divide-border">
              <details className="group py-4 sm:py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-medium sm:items-center sm:text-base">
                  <span className="min-w-0 flex-1 text-left">
                    Apakah strategi ini bebas risiko?
                  </span>
                  <span className="shrink-0 font-mono text-xl leading-none text-trading-gold transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[640px] pr-8 text-[14px] text-muted-foreground sm:mt-4 sm:text-[14.5px]">
                  Tidak. Menambah posisi bertahap berarti risiko juga bisa ikut
                  membesar kalau harga terus melawan. Fitur batas rugi harian
                  membantu mengerem kerugian, tapi risikonya tetap ada.
                </p>
              </details>
              <details className="group py-4 sm:py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-medium sm:items-center sm:text-base">
                  <span className="min-w-0 flex-1 text-left">
                    Apa bedanya Mode Aman dan Mode Cepat?
                  </span>
                  <span className="shrink-0 font-mono text-xl leading-none text-trading-gold transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[640px] pr-8 text-[14px] text-muted-foreground sm:mt-4 sm:text-[14.5px]">
                  Mode Aman menambah posisi lebih pelan dan risikonya lebih
                  kecil. Mode Cepat mengejar pemulihan lebih cepat, tapi dengan
                  risiko yang lebih besar.
                </p>
              </details>
              <details className="group py-4 sm:py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-medium sm:items-center sm:text-base">
                  <span className="min-w-0 flex-1 text-left">
                    Bagaimana cara kerja hedging-nya?
                  </span>
                  <span className="shrink-0 font-mono text-xl leading-none text-trading-gold transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[640px] pr-8 text-[14px] text-muted-foreground sm:mt-4 sm:text-[14.5px]">
                  Kalau harga bergerak melawan posisi utama, EA bisa membuka
                  posisi lawan arah secara otomatis untuk membantu
                  menyeimbangkan kerugian sementara.
                </p>
              </details>
              <details className="group py-4 sm:py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-medium sm:items-center sm:text-base">
                  <span className="min-w-0 flex-1 text-left">
                    Apakah wajib pakai VPS?
                  </span>
                  <span className="shrink-0 font-mono text-xl leading-none text-trading-gold transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[640px] pr-8 text-[14px] text-muted-foreground sm:mt-4 sm:text-[14.5px]">
                  Sangat disarankan, supaya EA tetap jalan 24/5 walau laptop
                  atau koneksi kamu mati.
                </p>
              </details>
              <details className="group py-4 sm:py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-medium sm:items-center sm:text-base">
                  <span className="min-w-0 flex-1 text-left">
                    Bedanya versi trial dan versi penuh apa?
                  </span>
                  <span className="shrink-0 font-mono text-xl leading-none text-trading-gold transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[640px] pr-8 text-[14px] text-muted-foreground sm:mt-4 sm:text-[14.5px]">
                  Cara kerjanya sama persis. Bedanya cuma versi trial dibatasi
                  waktu, terkunci ke satu akun, dan belum bisa pakai Mode Cepat.
                </p>
              </details>
              <details className="group py-4 sm:py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-medium sm:items-center sm:text-base">
                  <span className="min-w-0 flex-1 text-left">
                    Bisa dipakai di pair selain Gold?
                  </span>
                  <span className="shrink-0 font-mono text-xl leading-none text-trading-gold transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[640px] pr-8 text-[14px] text-muted-foreground sm:mt-4 sm:text-[14.5px]">
                  Fokus pengembangan dan pengujiannya khusus di XAUUSD (Gold).
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA BAND */}
        <section className="bg-muted/30 py-14 text-center sm:py-20 md:py-24">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <span className="eyebrow inline-flex items-center gap-2 font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-trading-gold">
              Mulai
            </span>
            <h2 className="mt-3 mb-3 text-2xl font-semibold leading-tight sm:mt-4 sm:mb-4 sm:text-3xl md:text-[42px]">
              Biarkan mesin yang menghitung step-nya.
            </h2>
            <p className="mx-auto mb-7 max-w-[480px] text-[14.5px] text-muted-foreground sm:mb-8 sm:text-[15.5px]">
              Ajukan trial dan lihat sendiri bagaimana SMH EA mengelola
              martingale dan hedging di akun Anda.
            </p>
            <Button
              asChild
              className="bg-trading-gold text-background hover:bg-trading-gold/90 h-11 w-full max-w-xs px-6 font-semibold sm:w-auto"
            >
              <Link href="/member/register">Ajukan Akses Trial</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-8 sm:gap-10 md:flex-row md:justify-between md:items-start">
            <div className="min-w-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-bold text-base tracking-tight sm:text-lg"
              >
                <img
                  src="/logo_smh.png"
                  alt="Logo"
                  className="h-7 w-auto shrink-0 object-contain sm:h-8"
                />
                <span className="truncate">Smart Martingale Hedging</span>
              </Link>
              <p className="mt-2.5 max-w-[320px] text-[13.5px] text-muted-foreground">
                Smart Martingale Hedging - Expert Advisor MetaTrader 5 untuk
                XAUUSD.
              </p>
            </div>
            <div className="flex flex-wrap gap-10 sm:gap-14">
              <div className="flex flex-col">
                <h4 className="mb-3.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Navigasi
                </h4>
                <Link
                  href="#cara-kerja"
                  className="mb-2.5 text-sm text-muted-foreground hover:text-trading-gold transition-colors"
                >
                  Cara Kerja
                </Link>
                <Link
                  href="#modul"
                  className="mb-2.5 text-sm text-muted-foreground hover:text-trading-gold transition-colors"
                >
                  Modul
                </Link>
                <Link
                  href="#harga"
                  className="mb-2.5 text-sm text-muted-foreground hover:text-trading-gold transition-colors"
                >
                  Paket & Harga
                </Link>
                <Link
                  href="#faq"
                  className="text-sm text-muted-foreground hover:text-trading-gold transition-colors"
                >
                  FAQ
                </Link>
              </div>
              <div className="flex flex-col">
                <h4 className="mb-3.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Kontak
                </h4>
                <Link
                  href="#"
                  className="mb-2.5 text-sm text-muted-foreground hover:text-trading-gold transition-colors"
                >
                  WhatsApp Admin
                </Link>
                <Link
                  href="#"
                  className="mb-2.5 text-sm text-muted-foreground hover:text-trading-gold transition-colors"
                >
                  Telegram
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-trading-gold transition-colors"
                >
                  Email
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-[11px] leading-relaxed text-muted-foreground/60 sm:text-xs">
            Trading forex dan komoditas seperti XAUUSD mengandung risiko tinggi
            dan dapat mengakibatkan kehilangan modal. Strategi martingale dan
            hedging secara khusus dapat memperbesar eksposur saat harga bergerak
            melawan posisi dalam waktu lama, dan berpotensi menimbulkan drawdown
            besar. SMH EA adalah alat bantu eksekusi berbasis aturan, bukan
            penasihat keuangan dan bukan jaminan profit. Kinerja masa lalu tidak
            mencerminkan hasil di masa depan. Gunakan manajemen risiko yang
            sesuai dengan profil dan toleransi Anda sendiri.
          </div>
        </div>
      </footer>
    </div>
  );
}
