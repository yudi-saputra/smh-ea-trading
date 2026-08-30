import type { Metadata } from "next";
import Link from "next/link";
import {
  Layers,
  Scale,
  CircleDollarSign,
  Target,
  AppWindow,
  ShieldCheck,
  Menu,
  Check,
  Minus,
  Calculator,
  Ban,
  TimerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisableContextMenu } from "@/components/shared/disable-context-menu";
import { HeroPhoneMockup } from "@/components/shared/hero-phone-mockup";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { whatsappLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Strategic Market Handler",
  description:
    "Strategic Market Handler (SMH) EA Control adalah Robot Trading Otomatis MetaTrader 5 dengan Dual Mode Strategy, yang dilengkapi batas kerugian harian agar ekuitas tetap terkendali.",
};

export default function PublicHomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-background font-sans selection:bg-trading-gold/20">
      <DisableContextMenu />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scroll-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll-left 34s linear infinite; }
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .hero-float { animation: hero-float 4.2s ease-in-out infinite; }
        .hero-float-delay-1 { animation-delay: 0.7s; }
        .hero-float-delay-2 { animation-delay: 1.5s; }
        @media (prefers-reduced-motion: reduce) {
          .hero-float { animation: none; }
        }
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
        <div className="mx-auto flex max-w-295 items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-4">
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
              <span className="sm:hidden">Strategic Market Handler</span>
              <span className="hidden sm:inline">Strategic Market Handler</span>
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
              href="#fitur"
              className="hover:text-trading-gold transition-colors"
            >
              Fitur
            </Link>
            <Link
              href="#untuk-siapa"
              className="hover:text-trading-gold transition-colors"
            >
              Cocok Untuk
            </Link>
            <Link
              href="#harga"
              className="hover:text-trading-gold transition-colors"
            >
              Harga
            </Link>
            <Link
              href="#faq"
              className="hover:text-trading-gold transition-colors"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <ThemeToggle className="size-9 shrink-0 sm:size-10" />
            <Button
              asChild
              variant="outline"
              className="font-semibold hidden sm:inline-flex h-10 px-5 border-border bg-background shadow-none hover:border-trading-gold hover:bg-trading-gold/10 hover:text-trading-gold dark:hover:bg-trading-gold/15"
            >
              <Link href="/member/login">Login</Link>
            </Button>
            <span
              className="hidden h-5 w-px shrink-0 bg-border sm:block"
              aria-hidden
            />
            <Button
              asChild
              className="bg-trading-gold text-background hover:bg-trading-gold/90 font-semibold hidden sm:inline-flex h-10 px-5"
            >
              <Link href="/member/register">Daftar</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="size-9 md:hidden sm:size-10"
            >
              <label htmlFor="menu-check" className="cursor-pointer">
                <Menu className="size-4" />
                <span className="sr-only">Menu</span>
              </label>
            </Button>
          </div>
        </div>
        <div className="mobile-panel hidden flex-col border-t border-border bg-background px-4 pb-4 pt-1 sm:px-6">
          {(
            [
              { href: "#cara-kerja", label: "Cara Kerja" },
              { href: "#fitur", label: "Fitur" },
              { href: "#untuk-siapa", label: "Cocok Untuk" },
              { href: "#harga", label: "Harga" },
              { href: "#faq", label: "FAQ" },
            ] as const
          ).map((item) => (
            <label
              key={item.href}
              htmlFor="menu-check"
              className="cursor-pointer border-b border-border/50"
            >
          <Link
                href={item.href}
                className="block py-3.5 text-[15px] text-muted-foreground active:text-foreground"
          >
                {item.label}
          </Link>
            </label>
          ))}
          <div className="mt-4 flex flex-col gap-2.5 sm:hidden">
            <Button
              asChild
              className="h-11 w-full bg-trading-gold text-background hover:bg-trading-gold/90 font-semibold"
            >
              <Link href="/member/register">Daftar</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 w-full border-border bg-background font-semibold shadow-none"
            >
              <Link href="/member/login">Login</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* HERO */}
        <section className="py-8 sm:py-10 md:flex md:min-h-[calc(100dvh-7.5rem)] md:items-center md:py-6 lg:py-8">
          <div className="mx-auto grid w-full max-w-295 gap-8 px-4 sm:gap-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-8 lg:gap-10">
            <div className="min-w-0">
              <h1 className="mb-3 text-[1.65rem] font-extrabold leading-[1.22] tracking-tight min-[380px]:text-[1.85rem] sm:mb-4 sm:text-4xl md:text-[40px] lg:text-[46px] lg:leading-[1.15]">
                Trading Otomatis,
                <br />
                Eksekusi{" "}
                <em className="not-italic text-trading-gold">
                  Presisi
                </em> dan <br />
                <em className="not-italic text-trading-gold">Risiko</em>{" "}
                terukur.
              </h1>
              <p className="mb-6 max-w-120 text-[14.5px] leading-relaxed text-muted-foreground sm:mb-6 sm:text-[16px]">
                Strategic Market Handler (SMH) EA Control adalah Robot Trading
                Otomatis MetaTrader 5 dengan Dual Mode Strategy, yang dilengkapi
                batas kerugian harian agar ekuitas tetap terkendali.
              </p>
              <div className="flex w-full flex-col gap-2.5 min-[400px]:flex-row min-[400px]:gap-3 sm:w-auto sm:flex-wrap">
                <Button
                  asChild
                  className="bg-trading-gold text-background hover:bg-trading-gold/90 h-11 w-full px-6 font-semibold min-[400px]:flex-1 sm:w-auto sm:flex-none"
                >
                  <Link href="#harga">Trial Gratis</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full border-border bg-background px-6 font-semibold shadow-none hover:border-trading-gold hover:bg-trading-gold/10 hover:text-trading-gold min-[400px]:flex-1 sm:w-auto sm:flex-none dark:hover:bg-trading-gold/15"
                >
                  <Link href="#cara-kerja">Cara Kerja</Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-90 justify-center md:max-w-none md:justify-end">
              <HeroPhoneMockup />
            </div>
          </div>
        </section>

        {/* PAIN POINTS */}
        <section className="bg-secondary dark:bg-muted/25 py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-295 px-4 sm:px-6">
            <div className="mb-6 max-w-160 sm:mb-10">
              <h2 className="text-[1.4rem] font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Strategi sudah benar. Eksekusi manual yang rawan.
              </h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15.5px]">
                Dual Mode Strategy membutuhkan ketepatan. Di tangan manusia,
                kesalahan kecil sering datang dari kelelahan, keterlambatan,
                atau emosi.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-5 md:grid-cols-3 md:items-stretch">
              {(
                [
                  {
                    icon: Calculator,
                    label: "Salah Hitung",
                    title: "Lot dihitung manual, mudah meleset.",
                    desc: "Satu kesalahan saat menambah posisi bisa membuat total risiko jauh lebih besar dari rencana.",
                  },
                  {
                    icon: Ban,
                    label: "Lupa Berhenti",
                    title: "Batas rugi harian hanya niat, bukan aturan.",
                    desc: "Saat pasar bergerak cepat, batas yang sudah ditentukan sering dilanggar sendiri.",
                  },
                  {
                    icon: TimerOff,
                    label: "Telat Hedge",
                    title: "Posisi penyeimbang dibuka terlambat.",
                    desc: "Jika harga sudah bergerak jauh, hedge manual menjadi kurang efektif untuk menahan floating.",
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex flex-col rounded-xl border border-border/80 bg-card p-4 sm:rounded-2xl sm:p-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-trading-gold/25 bg-trading-gold/10 text-trading-gold">
                        <Icon className="size-4" strokeWidth={2} />
                </span>
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-trading-gold">
                        {item.label}
                </span>
              </div>
                    <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-tight sm:mt-4 sm:text-lg">
                      {item.title}
                </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground sm:mt-2 sm:text-[14.5px]">
                      {item.desc}
                </p>
              </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CARA KERJA */}
        <section
          id="cara-kerja"
          className="scroll-mt-20 py-12 sm:py-16 md:py-24"
        >
          <div className="mx-auto max-w-295 px-4 sm:px-6">
            <div className="mb-6 max-w-160 sm:mb-12">
              <h2 className="text-[1.4rem] font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Cukup 4 Langkah untuk Menjalankan EA ini
              </h2>
            </div>
            <div className="grid overflow-hidden rounded-xl border border-border sm:rounded-2xl sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative border-b border-border bg-card p-5 transition-colors duration-300 hover:bg-muted/50 sm:p-8 sm:border-r lg:border-b-0">
                <span className="mb-2.5 block font-mono text-xs font-semibold text-trading-gold sm:mb-4">
                  01
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-base">
                  Buka Posisi
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  EA membuka posisi pertama secara otomatis sesuai pengaturan
                  lot dasar.
                </p>
              </div>
              <div className="relative border-b border-border bg-card p-5 transition-colors duration-300 hover:bg-muted/50 sm:p-8 lg:border-b-0 lg:border-r">
                <span className="mb-2.5 block font-mono text-xs font-semibold text-trading-gold sm:mb-4">
                  02
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-base">
                  Tambah Posisi Bertahap
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  Kalau harga melawan, EA menambah posisi bertahap dan
                  terkontrol, bukan sekadar gandakan lot.
                </p>
              </div>
              <div className="relative border-b border-border bg-card p-5 transition-colors duration-300 hover:bg-muted/50 sm:border-r sm:p-8 sm:border-b-0 lg:border-b-0">
                <span className="mb-2.5 block font-mono text-xs font-semibold text-trading-gold sm:mb-4">
                  03
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-base">
                  Buka Posisi Penyeimbang
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  Saat perlu, EA membuka posisi lawan arah (hedge) untuk
                  membantu menyeimbangkan kerugian sementara.
                </p>
              </div>
              <div className="relative bg-card p-5 transition-colors duration-300 hover:bg-muted/50 sm:p-8">
                <span className="mb-2.5 block font-mono text-xs font-semibold text-trading-gold sm:mb-4">
                  04
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-base">
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

        {/* FITUR */}
        <section
          id="fitur"
          className="scroll-mt-20 bg-secondary dark:bg-muted/25 py-12 sm:py-16 md:py-24"
        >
          <div className="mx-auto max-w-295 px-4 sm:px-6">
            <div className="mb-6 max-w-160 sm:mb-12">
              <h2 className="text-[1.4rem] font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Fitur Lengkap yang Ada di EA ini
              </h2>
              <p className="mt-2.5 text-[14px] text-muted-foreground sm:mt-4 sm:text-[15.5px]">
                Semua fitur ini digunakan langsung tiap hari.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:rounded-2xl sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-card p-4 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold sm:mb-4 sm:size-11">
                  <Layers className="size-4 sm:size-5" />
                </div>
                <span className="mb-1 block font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground sm:text-[11px]">
                  2 PILIHAN MODE
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-[16.5px]">
                  Mode Aman & Cepat
                </h3>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">
                  Pilih seberapa besar posisi tambahan dibuka, konservatif atau
                  lebih agresif.
                </p>
              </div>
              <div className="bg-card p-4 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold sm:mb-4 sm:size-11">
                  <Scale className="size-4 sm:size-5" />
                </div>
                <span className="mb-1 block font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground sm:text-[11px]">
                  HEDGING
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-[16.5px]">
                  Posisi Penyeimbang Otomatis
                </h3>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">
                  EA bisa membuka posisi lawan arah otomatis untuk membantu
                  menahan kerugian agar tidak terlalu besar.
                </p>
              </div>
              <div className="bg-card p-4 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold sm:mb-4 sm:size-11">
                  <CircleDollarSign className="size-4 sm:size-5" />
                </div>
                <span className="mb-1 block font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground sm:text-[11px]">
                  BATAS RUGI
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-[16.5px]">
                  Target & Batas Rugi Harian
                </h3>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">
                  Cukup atur strategi, maka EA akan berhenti otomatis kalau
                  target atau batas rugi sudah tercapai.
                </p>
              </div>
              <div className="bg-card p-4 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold sm:mb-4 sm:size-11">
                  <Target className="size-4 sm:size-5" />
                </div>
                <span className="mb-1 block font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground sm:text-[11px]">
                  TP OTOMATIS
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-[16.5px]">
                  Ambil Profit Bertahap
                </h3>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">
                  Garis take profit mengikuti pergerakan harga, jadi profit bisa
                  diamankan lebih optimal.
                </p>
              </div>
              <div className="bg-card p-4 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold sm:mb-4 sm:size-11">
                  <AppWindow className="size-4 sm:size-5" />
                </div>
                <span className="mb-1 block font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground sm:text-[11px]">
                  MUDAH DIGUNAKAN
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-[16.5px]">
                  Kontroler & Pengaturan
                </h3>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">
                  Semua kontroler & pengaturan ada langsung di panel web, tidak
                  perlu aplikasi tambahan.
                </p>
              </div>
              <div className="bg-card p-4 transition-colors duration-300 hover:bg-muted/50 group sm:p-7">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-trading-gold sm:mb-4 sm:size-11">
                  <ShieldCheck className="size-4 sm:size-5" />
                </div>
                <span className="mb-1 block font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground sm:text-[11px]">
                  AMAN
                </span>
                <h3 className="mb-1.5 text-[15px] font-semibold sm:mb-2.5 sm:text-[16.5px]">
                  Versi Trial Terkunci
                </h3>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">
                  Versi coba gratis dikunci ke satu akun dan ada batas waktunya,
                  jadi aman untuk dibagikan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* UNTUK SIAPA */}
        <section
          id="untuk-siapa"
          className="scroll-mt-20 py-12 sm:py-16 md:py-24"
        >
          <div className="mx-auto grid max-w-295 items-center gap-7 px-4 sm:gap-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-14 lg:gap-16">
            <div className="min-w-0 max-w-md">
              <h2 className="text-[1.4rem] font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Cocok untuk siapa EA ini?
              </h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15.5px]">
                Bukan strategi bebas risiko. Cocok jika kamu sudah paham Dual
                Mode Strategy, dan ingin eksekusi yang konsisten tanpa pantau
                chart terus-menerus.
              </p>
            </div>

            <ul className="min-w-0 divide-y divide-border/60 rounded-xl border border-border/80 bg-card px-3.5 sm:rounded-2xl sm:px-5">
              {[
                {
                  title: "Trading XAUUSD (Gold)",
                  desc: "Fokus dan diuji khusus untuk pair ini.",
                },
                {
                  title: "Sudah paham risikonya",
                  desc: "Tahu bahwa menambah posisi juga memperbesar risiko.",
                },
                {
                  title: "Pakai VPS",
                  desc: "EA jalan 24/5 tanpa tergantung laptop menyala.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-3 py-3.5 sm:gap-3.5 sm:py-5"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-trading-gold/12 text-trading-gold">
                    <Check className="size-3.5" strokeWidth={2.5} />
                </span>
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-semibold leading-snug text-foreground sm:text-base">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground sm:text-[14.5px]">
                      {item.desc}
                    </p>
                  </div>
              </li>
              ))}
            </ul>
          </div>
        </section>

        {/* HARGA / PAKET */}
        <section
          id="harga"
          className="scroll-mt-20 bg-secondary dark:bg-muted/25 py-12 sm:py-16 md:py-24"
        >
          <div className="mx-auto max-w-295 px-4 sm:px-6">
            <div className="mb-6 max-w-160 sm:mb-12">
              <h2 className="text-[1.4rem] font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Paket & Harga
              </h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-[15.5px]">
                Pilih paket yang sesuai dengan kebutuhan Anda.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-3 md:items-stretch">
              {(
                [
                  {
                    key: "trial",
                    featured: false,
                    badge: null,
                    title: "Trial",
                    price: "Gratis",
                    period: null as string | null,
                    desc: "Masa aktif terbatas, terkunci ke satu akun.",
                    cta: "Coba Trial",
                    ctaHref: "/member/register",
                    ctaVariant: "outline" as const,
                    features: [
                      { ok: true, text: "Dual Mode Strategy" },
                      { ok: true, text: "Panel kontrol on-chart" },
                      { ok: false, text: "Grup Komunitas" },
                      { ok: true, text: "Penanganan responsif" },
                      { ok: true, text: "Dukungan pemasangan di VPS" },
                    ],
                  },
                  {
                    key: "elit",
                    featured: true,
                    badge: "Paling Populer",
                    title: "Paket Elit",
                    price: "Rp 650.000",
                    period: "/bulan" as string | null,
                    desc: "1 akun live dan menjadi mitra dengan masa aktif 1 bulan.",
                    cta: "Pesan Sekarang",
                    ctaHref: "/member/register",
                    ctaVariant: "default" as const,
                    features: [
                      { ok: true, text: "Menjadi Bagian / Mitra" },
                      { ok: true, text: "Dual Mode Strategy" },
                      { ok: true, text: "Panel kontrol on-chart" },
                      { ok: true, text: "Grup Komunitas" },
                      { ok: true, text: "Penanganan responsif" },
                      { ok: true, text: "Dukungan pemasangan di VPS" },
                    ],
                  },
                  {
                    key: "ultimate",
                    featured: false,
                    badge: null,
                    title: "Paket Ultimate",
                    price: "Rp 1.650.000",
                    period: "/bulan" as string | null,
                    desc: "1 akun live dan tidak terikat mitra dengan masa aktif 1 bulan.",
                    cta: "Pesan Sekarang",
                    ctaHref: "/member/register",
                    ctaVariant: "outline" as const,
                    features: [
                      { ok: true, text: "Tidak Menjadi Bagian / Mitra" },
                      { ok: true, text: "Dual Mode Strategy" },
                      { ok: true, text: "Panel kontrol on-chart" },
                      { ok: true, text: "Grup Komunitas" },
                      { ok: true, text: "Penanganan responsif" },
                      { ok: true, text: "Dukungan pemasangan di VPS" },
                    ],
                  },
                ] as const
              ).map((pkg) => (
                <div
                  key={pkg.key}
                  className={
                    pkg.featured
                      ? "relative flex flex-col rounded-xl border border-trading-gold bg-linear-to-b from-trading-gold/10 to-card p-4 shadow-sm sm:rounded-2xl sm:p-6"
                      : "relative flex flex-col rounded-xl border border-border/80 bg-card p-4 sm:rounded-2xl sm:p-6"
                  }
                >
                  {pkg.badge ? (
                    <span className="absolute top-0 right-4 rounded-b-md bg-trading-gold px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-background sm:right-5">
                      {pkg.badge}
                    </span>
                  ) : null}

                  <div className="sm:min-h-36">
                    <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      {pkg.title}
                    </h3>
                    <p className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-semibold tracking-tight text-trading-gold sm:text-[1.75rem]">
                        {pkg.price}
                </span>
                      {pkg.period ? (
                        <span className="text-[13px] text-muted-foreground">
                          {pkg.period}
                </span>
                      ) : null}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                      {pkg.desc}
                    </p>
                  </div>

                  <ul className="mt-4 mb-5 flex flex-1 flex-col divide-y divide-border/50 border-t border-border/50 sm:mt-5 sm:mb-6">
                    {pkg.features.map((f) => (
                      <li
                        key={f.text}
                        className={
                          f.ok
                            ? "flex items-start gap-2.5 py-2 text-[13px] text-muted-foreground sm:py-2.5 sm:text-[13.5px]"
                            : "flex items-start gap-2.5 py-2 text-[13px] text-muted-foreground/40 sm:py-2.5 sm:text-[13.5px]"
                        }
                      >
                        {f.ok ? (
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-trading-profit"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <Minus className="mt-0.5 size-4 shrink-0" />
                        )}
                        <span>{f.text}</span>
                  </li>
                    ))}
                </ul>

                  {pkg.ctaVariant === "default" ? (
                <Button
                  asChild
                      className="mt-auto h-11 w-full justify-center bg-trading-gold font-semibold text-background hover:bg-trading-gold/90"
                >
                      <Link href={pkg.ctaHref}>{pkg.cta}</Link>
                </Button>
                  ) : (
                <Button
                  asChild
                  variant="outline"
                      className="mt-auto h-11 w-full justify-center border-border bg-background font-semibold shadow-none hover:border-trading-gold hover:bg-trading-gold/10 hover:text-trading-gold dark:hover:bg-trading-gold/15"
                >
                      <Link href={pkg.ctaHref}>{pkg.cta}</Link>
                </Button>
                  )}
              </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-295 px-4 sm:px-6">
            <div className="mx-auto mb-6 max-w-140 text-center sm:mb-10">
              <h2 className="text-[1.4rem] font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Pertanyaan Umum (FAQ)
              </h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground sm:mt-3 sm:text-[15.5px]">
                Jawaban singkat soal risiko, mode, VPS, dan lisensi yang sering
                diajukan.
              </p>
            </div>

            <div className="mx-auto max-w-190 overflow-hidden rounded-xl border border-border/80 bg-card divide-y divide-border/60 sm:rounded-2xl">
              {(
                [
                  {
                    q: "Apakah strategi ini bebas risiko?",
                    a: "Tidak. Menambah posisi bertahap bisa memperbesar risiko jika harga terus melawan. Batas rugi harian membantu menahan kerugian, tapi risiko tetap ada.",
                  },
                  {
                    q: "Apa bedanya Mode Konservatif dan Mode Agresif?",
                    a: "Mode Konservatif menambah posisi lebih pelan dengan risiko lebih kecil. Mode Agresif mengejar pemulihan lebih cepat, dengan risiko lebih besar.",
                  },
                  {
                    q: "Bagaimana cara kerja hedging-nya?",
                    a: "Jika harga bergerak melawan posisi utama, EA dapat membuka posisi lawan arah otomatis untuk menyeimbangkan floating sementara.",
                  },
                  {
                    q: "Apakah wajib pakai VPS?",
                    a: "Sangat disarankan agar EA tetap jalan 24/5 meskipun laptop atau koneksi Anda mati.",
                  },
                  {
                    q: "Bedanya trial dan versi penuh?",
                    a: "Cara kerjanya sama. Trial dibatasi waktu, terkunci ke satu akun, dan belum bisa memakai Mode Cepat.",
                  },
                  {
                    q: "Bisa dipakai di pair selain Gold?",
                    a: "Fokus pengembangan dan pengujian khusus di XAUUSD (Gold).",
                  },
                ] as const
              ).map((item) => (
                <details
                  key={item.q}
                  className="group px-3.5 sm:px-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-left text-[14.5px] font-medium transition-colors hover:text-trading-gold sm:gap-4 sm:py-5 sm:text-base">
                    <span className="min-w-0 flex-1 leading-snug">
                      {item.q}
                  </span>
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/80 font-mono text-lg leading-none text-trading-gold transition duration-300 group-open:rotate-45"
                    >
                    +
                  </span>
                </summary>
                  <p className="pb-3.5 pr-8 text-[13.5px] leading-relaxed text-muted-foreground sm:pb-5 sm:pr-10 sm:text-[14.5px]">
                    {item.a}
                </p>
              </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BAND */}
        <section className="relative overflow-hidden border-y border-border/70 bg-secondary dark:bg-muted/35 py-12 text-center sm:py-20 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--trading-gold)_14%,transparent),transparent_50%)]"
          />
          <div className="relative mx-auto max-w-190 px-4 sm:px-6">
            <h2 className="text-[1.4rem] font-semibold leading-tight tracking-tight sm:mt-4 sm:text-3xl md:text-[40px] md:leading-[1.2]">
              Lihat sendiri bagaimana EA mengelola{" "}
              <em className="not-italic text-trading-gold">XAUUSD</em> di akun
              Anda.
            </h2>
            <p className="mx-auto mt-3 max-w-135 text-[14px] leading-relaxed text-foreground/75 sm:mt-5 sm:text-base">
              Trial gratis, terkunci ke satu akun, tanpa komitmen. Uji eksekusi,
              kontrol web, dan batas rugi harian sebelum memutuskan.
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:mt-9 sm:flex-row sm:items-center sm:gap-3.5">
            <Button
              asChild
                className="h-11 w-full bg-trading-gold px-7 text-[15px] font-semibold text-background hover:bg-trading-gold/90 sm:h-12 sm:w-auto sm:max-w-xs"
              >
                <Link href="/member/register">Mulai Trial Gratis</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full border-border bg-background px-7 text-[15px] font-semibold shadow-none hover:border-trading-gold hover:bg-trading-gold/10 hover:text-trading-gold sm:h-12 sm:w-auto sm:max-w-xs dark:hover:bg-trading-gold/15"
              >
                <Link href="/member/login">Sudah punya akun?</Link>
            </Button>
            </div>
            <p className="mt-4 text-[12px] tracking-wide text-muted-foreground sm:mt-5 sm:text-[13px]">
              Setup cepat · Kontrol dari panel web · Fokus Gold (XAUUSD)
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div className="mx-auto max-w-295 px-4 sm:px-6">
          <div className="grid gap-8 sm:gap-10 md:grid-cols-[minmax(0,1.15fr)_auto_auto] md:items-start md:gap-16 lg:gap-24">
            <div className="min-w-0 max-w-sm">
              <Link
                href="/"
                className="inline-flex max-w-full items-center gap-2.5 font-bold text-base tracking-tight sm:text-lg"
              >
                <img
                  src="/logo_smh.png"
                  alt="Logo"
                  className="h-7 w-auto shrink-0 object-contain sm:h-8"
                />
                <span className="truncate">Strategic Market Handler</span>
              </Link>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                Strategic Market Handler (SMH) EA Control adalah Robot Trading
                Otomatis MetaTrader 5 dengan Dual Mode Strategy, yang dilengkapi
                batas kerugian harian agar ekuitas tetap terkendali.
              </p>
              <div className="mt-4 flex items-center gap-2">
                {(
                  [
                    {
                      label: "WhatsApp",
                      href: whatsappLink(),
                      path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
                    },
                    {
                      label: "Telegram",
                      href: "https://t.me/hafidhjourney",
                      path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
                    },
                    {
                      label: "Instagram",
                      href: "https://www.instagram.com/hafidhagungfirmansyah",
                      path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
                    },
                    {
                      label: "TikTok",
                      href: "https://www.tiktok.com/@hafidhjourney",
                      path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
                    },
                  ] as const
                ).map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground transition-colors hover:border-trading-gold/40 hover:text-trading-gold"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4 fill-current"
                      aria-hidden
                    >
                      <path d={item.path} />
                    </svg>
                  </a>
                ))}
            </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:gap-12 md:contents">
              <div className="min-w-0">
                <h4 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/55 sm:mb-3.5 sm:text-[11px]">
                  Navigasi
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {(
                    [
                      { href: "#cara-kerja", label: "Cara Kerja" },
                      { href: "#fitur", label: "Fitur" },
                      { href: "#untuk-siapa", label: "Cocok Untuk" },
                      { href: "#harga", label: "Harga" },
                      { href: "#faq", label: "FAQ" },
                    ] as const
                  ).map((item) => (
                    <li key={item.href}>
                <Link
                        href={item.href}
                        className="text-[13.5px] text-muted-foreground transition-colors hover:text-trading-gold sm:text-sm"
                >
                        {item.label}
                </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0">
                <h4 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/55 sm:mb-3.5 sm:text-[11px]">
                  Sosial Media
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {(
                    [
                      {
                        href: whatsappLink(),
                        label: "WhatsApp",
                      },
                      {
                        href: "https://t.me/hafidhjourney",
                        label: "Telegram",
                      },
                      {
                        href: "https://www.instagram.com/hafidhagungfirmansyah",
                        label: "Instagram",
                      },
                      {
                        href: "https://www.tiktok.com/@hafidhjourney",
                        label: "TikTok",
                      },
                    ] as const
                  ).map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13.5px] text-muted-foreground transition-colors hover:text-trading-gold sm:text-sm"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-border/70 pt-5 sm:mt-10 sm:pt-6">
            <p className="text-[11px] leading-relaxed text-muted-foreground/55 sm:text-xs">
              Trading forex dan komoditas seperti XAUUSD mengandung risiko
              tinggi dan dapat mengakibatkan kehilangan modal. Dual Mode
              Strategy secara khusus dapat memperbesar eksposur saat harga
              bergerak melawan posisi dalam waktu lama, dan berpotensi
              menimbulkan drawdown besar. SMH EA Control adalah alat bantu
              eksekusi berbasis aturan, bukan penasihat keuangan dan bukan
              jaminan profit. Kinerja masa lalu tidak mencerminkan hasil di masa
              depan. Gunakan manajemen risiko yang sesuai dengan profil dan
              toleransi Anda sendiri.
            </p>
            <p className="mt-4 text-[11px] text-muted-foreground/45 sm:mt-5 sm:text-xs">
              © {new Date().getFullYear()} Strategic Market Handler, all rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
