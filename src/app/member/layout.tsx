import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { MemberPwaRegister } from "@/components/member/pwa-register";

export const metadata: Metadata = {
  applicationName: "SMH Control Panel",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SMH Control Panel",
  },
  icons: {
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
