import type { Metadata } from "next";
import { ErrorView } from "@/components/shared/error-view";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFoundPage() {
  return (
    <ErrorView
      code="404"
      title="Halaman tidak ditemukan"
      description="Alamat yang Anda buka tidak ada, sudah dipindahkan, atau salah ketik. Periksa URL atau kembali ke beranda."
      primaryHref="/"
      primaryLabel="Ke beranda"
      secondaryHref="/member/login"
      secondaryLabel="Masuk member"
    />
  );
}
