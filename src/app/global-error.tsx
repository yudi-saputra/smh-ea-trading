"use client";

import { useEffect } from "react";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ErrorView } from "@/components/shared/error-view";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Replaces the root layout when it fails. Must own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorView
            code="500"
            title="Aplikasi bermasalah"
            description="Kesalahan kritis pada aplikasi. Muat ulang halaman, atau kembali nanti. Jika berlanjut, hubungi admin dengan kode referensi di bawah."
            digest={error.digest}
            onRetry={reset}
            retryLabel="Muat ulang"
            primaryHref="/"
            primaryLabel="Ke beranda"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
