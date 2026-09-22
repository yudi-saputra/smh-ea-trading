"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CalendarDaysIcon,
  CircleHelpIcon,
  FileTextIcon,
  LogOutIcon,
  ShieldCheckIcon,
  SunMoonIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { whatsappLink } from "@/lib/contact";

export function MemberLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/member/auth/logout", { method: "POST" });
    router.replace("/member/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="destructive"
      className="w-full gap-2"
      onClick={logout}
    >
      <LogOutIcon className="size-4" />
      Keluar
    </Button>
  );
}

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function MemberThemeMenu() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-3 border-t border-border/60 px-4 py-3.5">
      <SunMoonIcon
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <span className="type-ui min-w-0 flex-1 font-medium">Tampilan</span>
      {mounted ? (
        <Select
          value={theme ?? "system"}
          onValueChange={(value) => setTheme(value)}
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-30 shrink-0 rounded-lg border-border/80 bg-background"
            aria-label="Pilih theme"
          >
            <SelectValue placeholder="System" />
          </SelectTrigger>
          <SelectContent align="end">
            {THEME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="type-caption shrink-0 text-muted-foreground">
          System
        </span>
      )}
    </div>
  );
}

const SOCIAL_LINKS = [
  {
    label: "WhatsApp",
    href: whatsappLink(
      "Halo kak, saya tertarik dengan EA nya. Apakah bisa dijelaskan detail tentang EA nya?",
    ),
    icon: (
      <svg viewBox="0 0 24 24" className="size-7 fill-[#25D366]" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "https://t.me/hafidhjourney",
    icon: (
      <svg viewBox="0 0 24 24" className="size-7 fill-[#229ED9]" aria-hidden>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@hafidhjourney",
    icon: (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
        <path
          fill="#25F4EE"
          d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
          transform="translate(-0.6 0.4)"
        />
        <path
          fill="#FE2C55"
          d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
          transform="translate(0.6 -0.4)"
        />
        <path
          fill="currentColor"
          className="text-foreground"
          d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
        />
      </svg>
    ),
  },
] as const;

export function MemberSocialLinks() {
  return (
    <section className="space-y-3">
      <h3 className="type-ui font-semibold tracking-tight">Social Media</h3>
      <div className="flex items-center justify-center gap-5">
        {SOCIAL_LINKS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            className="inline-flex size-11 items-center justify-center rounded-full transition-transform duration-200 ease-out hover:scale-110 hover:brightness-110 active:scale-95 active:opacity-80"
          >
            {item.icon}
          </a>
        ))}
      </div>
    </section>
  );
}

export function MemberProfileCard({
  name,
  email,
  createdAt,
}: {
  name: string;
  email: string;
  createdAt?: string | null;
}) {
  const initial = (name.trim()[0] ?? "U").toUpperCase();
  const registeredLabel = createdAt
    ? new Date(createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted type-title">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-title truncate">{name}</p>
          <p className="type-ui mt-0.5 truncate text-muted-foreground">
            {email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border/60 px-4 py-3.5">
        <CalendarDaysIcon
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <p className="type-ui min-w-0 flex-1 font-medium">Terdaftar</p>
        <p className="type-ui shrink-0 text-muted-foreground">
          {registeredLabel}
        </p>
      </div>
    </div>
  );
}

function GuideTerm({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="type-body font-semibold text-foreground">{title}</p>
      <div className="type-body mt-0.5 space-y-2 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

function GuideSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <p className="type-label tracking-[0.12em] text-foreground">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function BantuanGuide() {
  return (
    <div className="space-y-5 pr-2">
      <GuideSection title="Fungsi Tombol">
        <GuideTerm title="ON">
          <p>
            Mengaktifkan EA dan memulai trading secara otomatis sesuai dengan
            logic yang digunakan.
          </p>
        </GuideTerm>
        <GuideTerm title="OFF">
          <p>
            Menonaktifkan EA sekaligus menutup seluruh posisi yang sedang
            terbuka.
          </p>
        </GuideTerm>
        <GuideTerm title="PAUSE">
          <p>
            Menjeda EA dan menghentikan pembukaan posisi baru. Posisi yang
            sudah terbuka tetap berjalan.
          </p>
        </GuideTerm>
        <GuideTerm title="RESET">
          <p>
            Mereset sistem setelah target profit atau batas kerugian harian
            tercapai.
          </p>
        </GuideTerm>
      </GuideSection>

      <GuideSection title="Mode Entry">
        <GuideTerm title="1 ARAH">
          <p>
            EA hanya membuka posisi BUY atau SELL sesuai dengan logic dan signal
            yang digunakan.
          </p>
        </GuideTerm>
        <GuideTerm title="2 ARAH">
          <p>
            EA dapat membuka posisi BUY dan SELL secara bersamaan sesuai dengan
            sistem hedging.
          </p>
        </GuideTerm>
      </GuideSection>

      <GuideSection title="Mode Lot">
        <GuideTerm title="CONSERVATIVE">
          <p>
            Lot meningkat secara bertahap berdasarkan penambahan lot yang lebih
            stabil.
          </p>
        </GuideTerm>
        <GuideTerm title="AGGRESSIVE">
          <p>
            Lot meningkat menggunakan sistem perkalian (multiplier), sehingga
            kenaikan lot lebih cepat.
          </p>
        </GuideTerm>
      </GuideSection>

      <GuideSection title="Pengaturan">
        <GuideTerm title="Setlayer">
          <p>Mengatur jarak antar layer posisi.</p>
        </GuideTerm>
        <GuideTerm title="Naik Lot Mode Agresif">
          <p>Mengatur nilai perkalian lot pada mode Aggressive.</p>
        </GuideTerm>
        <GuideTerm title="Settargetprofit">
          <p>Mengatur target profit harian EA.</p>
        </GuideTerm>
        <GuideTerm title="Setcutloss">
          <p>Mengatur batas kerugian harian EA.</p>
        </GuideTerm>
        <GuideTerm title="Maxlot">
          <p>Mengatur batas maksimal lot untuk setiap posisi.</p>
        </GuideTerm>
        <GuideTerm title="Maxlayer">
          <p>Mengatur jumlah maksimal layer yang dapat dibuka.</p>
        </GuideTerm>
        <GuideTerm title="Lot Awal">
          <p>
            Mengatur ukuran lot pada posisi pertama saat EA mulai entry.
          </p>
        </GuideTerm>
        <GuideTerm title="Naik Lot Per X Layer">
          <p>
            Mengatur jumlah layer yang harus tercapai sebelum lot dinaikkan ke
            ukuran berikutnya.
          </p>
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="font-medium text-foreground">Contoh:</p>
            <p className="mt-1 font-medium text-foreground">
              Naik Lot Per 3 Layer
            </p>
            <ul className="mt-1.5 space-y-0.5 font-mono text-[0.925em]">
              <li>Layer 1-3 → Lot awal</li>
              <li>Layer 4-6 → Lot berikutnya</li>
              <li>Layer 7-9 → Lot berikutnya</li>
            </ul>
          </div>
        </GuideTerm>
        <GuideTerm title="Naik Lot Mode Konservatif">
          <p>
            Mode Conservative: besar kenaikan lot setiap kali syarat layer
            terpenuhi (contoh 0.01).
          </p>
        </GuideTerm>
      </GuideSection>
    </div>
  );
}

type InfoItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
};

const INFO_ITEMS: InfoItem[] = [
  {
    value: "bantuan",
    label: "Bantuan",
    icon: CircleHelpIcon,
    content: <BantuanGuide />,
  },
  {
    value: "syarat",
    label: "Syarat dan Ketentuan",
    icon: FileTextIcon,
    content: (
      <p className="type-body pr-2 leading-relaxed text-muted-foreground">
        Layanan ini hanya untuk pengguna resmi. Anda bertanggung jawab atas
        keamanan akun, ApiKey Controller, dan perintah trading yang dikirim dari
        aplikasi.
      </p>
    ),
  },
  {
    value: "privasi",
    label: "Kebijakan Privasi",
    icon: ShieldCheckIcon,
    content: (
      <p className="type-body pr-2 leading-relaxed text-muted-foreground">
        Data profil, terminal, dan log perintah digunakan untuk operasional
        trading Anda. Informasi tidak dibagikan ke pihak luar tanpa izin,
        kecuali diwajibkan hukum.
      </p>
    ),
  },
];

export function MemberInfoAccordion() {
  return (
    <section className="space-y-2">
      <h3 className="type-ui font-semibold tracking-tight">Info</h3>
      <Accordion
        type="single"
        collapsible
        className="overflow-hidden rounded-2xl border border-border/80 bg-card px-4"
      >
        {INFO_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <AccordionItem
              key={item.value}
              value={item.value}
              className="border-border/60"
            >
              <AccordionTrigger className="gap-3 py-3.5 hover:no-underline">
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                  <span className="type-ui truncate font-medium">
                    {item.label}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
