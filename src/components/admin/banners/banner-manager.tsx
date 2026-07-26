"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ImageIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { DataTableCard } from "@/components/admin/tables/data-table";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  src: string;
  alt: string;
  createdAt: string;
};

type UploadState = "idle" | "uploading" | "error" | "done";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKindLabel(file: File) {
  if (file.type === "image/png") return "PNG";
  if (file.type === "image/jpeg" || file.type === "image/jpg") return "JPG";
  return file.type || "File";
}

export function AdminBannerManager({ header }: { header?: ReactNode }) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [intervalSec, setIntervalSec] = useState(5);
  const [loading, setLoading] = useState(true);
  const [savingInterval, setSavingInterval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clearFile() {
    setFile(null);
    setUploadState("idle");
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function closeUpload() {
    setUploadOpen(false);
    clearFile();
    setAlt("");
    setDragOver(false);
  }

  async function pickFile(next: File | null) {
    setError(null);
    setUploadError(null);
    setUploadState("idle");
    if (!next) {
      clearFile();
      return;
    }

    const okType =
      next.type === "image/png" ||
      next.type === "image/jpeg" ||
      next.type === "image/jpg";
    if (!okType) {
      setFile(next);
      setUploadState("error");
      setUploadError("Hanya JPG atau PNG");
      return;
    }

    if (next.size > 2.5 * 1024 * 1024) {
      setFile(next);
      setUploadState("error");
      setUploadError("Maksimal 2.5MB");
      return;
    }

    const dimsOk = await new Promise<boolean>((resolve) => {
      const url = URL.createObjectURL(next);
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
      setFile(next);
      setUploadState("error");
      setUploadError("Harus landscape (lebar ≥ tinggi)");
      return;
    }

    setFile(next);
    setUploadState("idle");
  }

  async function onSaveInterval(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
    } catch {
      setError("Koneksi gagal");
    } finally {
      setSavingInterval(false);
    }
  }

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file || uploadState === "error") {
      setUploadState("error");
      setUploadError("Pilih file JPG atau PNG landscape yang valid");
      return;
    }

    setUploadState("uploading");
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
        setUploadState("error");
        setUploadError(data.error ?? "Upload gagal");
        return;
      }
      closeUpload();
      await load();
    } catch {
      setUploadState("error");
      setUploadError("Koneksi gagal");
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

  const pendingDescription = useMemo(() => {
    if (!file) return null;
    if (uploadState === "uploading") return "Mengunggah…";
    if (uploadState === "error") return uploadError ?? "Upload gagal";
    return `${fileKindLabel(file)} · ${formatBytes(file.size)}`;
  }, [file, uploadState, uploadError]);

  return (
    <div className="space-y-4">
      {header}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => void onSaveInterval(e)}
          className="flex flex-wrap items-center gap-2"
        >
          <Label htmlFor="banner-interval" className="text-sm text-muted-foreground">
            Interval (detik)
          </Label>
          <Input
            id="banner-interval"
            type="number"
            min={2}
            max={60}
            step={1}
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value) || 5)}
            className="h-9 w-20"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={savingInterval || loading}
            className="gap-1.5"
          >
            <SaveIcon className="size-3.5" aria-hidden />
            {savingInterval ? "…" : "Simpan"}
          </Button>
        </form>

        <Button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="gap-2 shrink-0"
        >
          <PlusIcon className="size-4" />
          Tambah
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DataTableCard scrollClassName={false}>
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Memuat…
          </div>
        ) : slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <ImageIcon
              className="size-8 text-muted-foreground/50"
              aria-hidden
            />
            <p className="text-sm font-medium">Belum ada banner</p>
            <p className="text-sm text-muted-foreground">
              Klik Tambah untuk mengunggah slide pertama.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {slides.map((slide) => (
              <li key={slide.id} className="p-3">
                <Attachment state="done" className="w-full max-w-none border-0 bg-transparent p-0 shadow-none">
                  <AttachmentMedia
                    variant="image"
                    className="aspect-[2.2/1] w-24 rounded-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- volume-backed /banners path */}
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className="size-full object-cover"
                    />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{slide.alt || "Banner"}</AttachmentTitle>
                    <AttachmentDescription>
                      {new Date(slide.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Hapus ${slide.alt || "banner"}`}
                      onClick={() => void onDelete(slide.id)}
                    >
                      <Trash2Icon />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              </li>
            ))}
          </ul>
        )}
      </DataTableCard>

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open) closeUpload();
          else setUploadOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form
            onSubmit={(e) => void onUpload(e)}
            className="grid gap-4"
          >
            <DialogHeader>
              <DialogTitle>Tambah banner</DialogTitle>
              <DialogDescription>
                JPG / PNG landscape, maks. 2.5MB. Disarankan 1320 × 600 px.
              </DialogDescription>
            </DialogHeader>

            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => void pickFile(e.target.files?.[0] ?? null)}
            />

            <label
              htmlFor={inputId}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
                dragOver
                  ? "border-ring bg-muted/50"
                  : "border-border hover:bg-muted/30",
              )}
            >
              <ImageIcon
                className="size-8 text-muted-foreground/60"
                aria-hidden
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Pilih atau seret gambar</p>
                <p className="text-sm text-muted-foreground">PNG atau JPG</p>
              </div>
            </label>

            {file ? (
              <Attachment
                state={uploadState === "idle" ? "idle" : uploadState}
                className="w-full max-w-none"
              >
                <AttachmentMedia variant={previewUrl ? "image" : "icon"}>
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                    <img src={previewUrl} alt="" />
                  ) : (
                    <ImageIcon />
                  )}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                  <AttachmentDescription>
                    {pendingDescription}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    type="button"
                    aria-label={`Hapus ${file.name}`}
                    disabled={uploadState === "uploading"}
                    onClick={clearFile}
                  >
                    <XIcon />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="banner-alt">Label (opsional)</Label>
              <Input
                id="banner-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Promo SMH"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeUpload}
                disabled={uploadState === "uploading"}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  !file ||
                  uploadState === "uploading" ||
                  uploadState === "error"
                }
                className="gap-2"
              >
                <UploadIcon className="size-4" aria-hidden />
                {uploadState === "uploading" ? "Mengunggah…" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
