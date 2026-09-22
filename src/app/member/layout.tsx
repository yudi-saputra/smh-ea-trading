import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { MemberPwaRegister } from "@/components/member/pwa-register";

export const metadata: Metadata = {
  applicationName: "Strategic Market Handler",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Strategic Market Handler",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo_smh.png", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function MemberAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Capture beforeinstallprompt before React hydrates (Chrome may fire early). */}
      <Script id="smh-pwa-capture" strategy="beforeInteractive">{`
        window.__smhPwaDeferred=null;
        window.addEventListener("beforeinstallprompt",function(e){
          e.preventDefault();
          window.__smhPwaDeferred=e;
          window.dispatchEvent(new Event("smh-pwa-deferred"));
        });
      `}</Script>
      <MemberPwaRegister />
      {children}
    </>
  );
}
