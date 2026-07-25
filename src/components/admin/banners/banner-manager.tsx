"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon, SaveIcon, TimerIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Slide = {
  id: string;
  src: string;
  alt: string;
  createdAt: string;
};

export function AdminBannerManager() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [intervalSec, setIntervalSec] = useState(5);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingInterval, setSavingInterval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intervalSaved, setIntervalSaved] = useState(false);
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/banners");
      const data = (await res.json()) as {
        ok?: boolean;
        slides?: Slide[];
        intervalSec?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat banner");
        return;
      }
      setSlides(data.slides ?? []);
      if (typeof data.intervalSec === "number") {
        setIntervalSec(data.intervalSec);
      }
    } catch {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveInterval(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIntervalSaved(false);
    setSavingInterval(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalSec }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        intervalSec?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan interval");
        return;
      }
      if (typeof data.intervalSec === "number") {
        setIntervalSec(data.intervalSec);
      }
      setIntervalSaved(true);
    } catch {
      setError("Koneksi gagal");
    } finally {
      setSavingInterval(false);
    }
  }

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Pilih file JPG atau PNG landscape");
      return;
    }

    const dimsOk = await new Promise<boolean>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img.width >= img.height);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      img.src = url;
    });

    if (!dimsOk) {
      setError("Gambar harus landscape (lebar ≥ tinggi)");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("alt", alt);
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Upload gagal");
        return;
      }
      setFile(null);
      setAlt("");
      await load();
    } catch {
      setError("Koneksi gagal");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Gagal menghapus");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-destructive">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={onSaveInterval}
        className="space-y-4 rounded-2xl border border-border/80 bg-card p-4"
      >
        <div className="flex items-center gap-2">
          <TimerIcon className="size-4 text-muted-foreground" aria-hidden />
          <p className="text-sm font-semibold">Durasi slide</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Interval ganti slide di Home (2–60 detik).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[8rem] flex-1 flex-col gap-1.5">
            <Label htmlFor="banner-interval">Detik</Label>
            <Input
              id="banner-interval"
              type="number"
              min={2}
              max={60}
              step={1}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value) || 5)}
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={savingInterval || loading}
            className="h-11 gap-2 rounded-xl"
          >
            <SaveIcon className="size-4" aria-hidden />
            {savingInterval ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
        {intervalSaved ? (
          <p className="text-xs text-trading-profit">
            Interval disimpan: {intervalSec} detik.
          </p>
        ) : null}
      </form>

      <form
        onSubmit={onUpload}
        className="space-y-4 rounded-2xl border border-border/80 bg-card p-4"
      >
        <div className="flex items-center gap-2">
          <UploadIcon className="size-4 text-muted-foreground" aria-hidden />
          <p className="text-sm font-semibold">Upload banner</p>
        </div>
        <p className="text-sm text-muted-foreground">
          JPG atau PNG landscape saja, maks. 2.5MB. Ukuran disarankan{" "}
          <span className="font-medium text-foreground">1320 × 600 px</span>{" "}
          (rasio 2.2:1). Tampil di Home sebagai slide.
        </p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="banner-file">File JPG / PNG</Label>
          <Input
            id="banner-file"
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            className="h-11 rounded-xl"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="banner-alt">Label (opsional)</Label>
          <Input
            id="banner-alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Promo SMH"
            className="h-11 rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={uploading || !file}
          className="h-11 gap-2 rounded-xl"
        >
          <UploadIcon className="size-4" aria-hidden />
          {uploading ? "Mengunggah…" : "Upload"}
        </Button>
      </form>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">Banner aktif</h3>
        {loading ? (
          <p className="text-xs text-muted-foreground">Memuat…</p>
        ) : slides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
            <ImageIcon
              className="mx-auto size-8 text-muted-foreground/50"
              aria-hidden
            />
            <p className="text-sm mt-2 text-muted-foreground">
              Belum ada banner. Home memakai placeholder.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {slides.map((slide) => (
              <li
                key={slide.id}
                className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3"
              >
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate font-medium">{slide.alt}</p>
                  <p className="text-xs truncate text-muted-foreground">
                    {slide.src}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  aria-label="Hapus banner"
                  onClick={() => void onDelete(slide.id)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
