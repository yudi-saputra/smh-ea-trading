"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/shared/error-view";

export default function AppError({
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
    <ErrorView
      code="500"
      title="Terjadi kesalahan"
      description="Sesuatu tidak berjalan semestinya. Silakan coba lagi. Jika berlanjut, hubungi admin dan sebutkan kode referensi di bawah."
      digest={error.digest}
      onRetry={reset}
      retryLabel="Coba lagi"
      primaryHref="/"
      primaryLabel="Ke beranda"
    />
  );
}
