"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClockIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPIRY_DURATION_OPTIONS,
  expiryYmdFromDurationMonths,
  formatExpiryYmdLabel,
} from "@/lib/expiry";

export type TraderOption = {
  id: string;
  email: string;
  displayName: string | null;
  idTrading: string;
  serverBroker: string;
};

export function CreateAccountForm({
  isAdmin,
  traders,
  listHref = "/admin/account",
  embedded = false,
  onDone,
}: {
  isAdmin: boolean;
  traders: TraderOption[];
  listHref?: string;
  /** Skip Card wrapper — for use inside Dialog. */
  embedded?: boolean;
  /** Called after success dismiss (or instead of navigating to listHref). */
  onDone?: () => void;
}) {
  const router = useRouter();
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [durationMonths, setDurationMonths] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const memberOptions = useMemo(
    () =>
      traders.map((t) => ({
        value: t.id,
        label: t.displayName?.trim() || t.email,
        keywords: `${t.email} ${t.idTrading} ${t.serverBroker}`,
      })),
    [traders],
  );

  const expiresAtYmd = useMemo(
    () => expiryYmdFromDurationMonths(Number(durationMonths) || 0),
    [durationMonths],
  );

  function finish() {
    if (onDone) {
      onDone();
      return;
    }
    router.push(listHref);
  }

  async function copyKey() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ownerMemberId) {
      setError("Pilih member terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerMemberId,
          ...(isAdmin ? { expiresAt: expiresAtYmd } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat akun");
        return;
      }
      setApiKey(data.apiKey);
      toast.success("Berhasil", {
        description: "Akun berhasil di tambahkan.",
      });
      router.refresh();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  const success = (
    <div className="grid gap-4">
      {embedded ? (
        <DialogHeader>
          <DialogTitle>API Key</DialogTitle>
          <DialogDescription>
            Salin ApiKey sekarang. Key juga tersimpan di kolom API Key.
          </DialogDescription>
        </DialogHeader>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-medium">API Key</p>
          <p className="text-sm text-muted-foreground">
            Salin ApiKey sekarang. Key juga tersimpan di kolom API Key.
          </p>
        </div>
      )}
      <pre className="overflow-x-auto rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap">
        {apiKey}
      </pre>
      <DialogFooter className={embedded ? undefined : "sm:justify-end"}>
        <Button type="button" variant="outline" onClick={copyKey} className="gap-2">
          <CopyIcon className="size-4" />
          {copied ? "Tersalin" : "Salin"}
        </Button>
        <Button type="button" onClick={finish}>
          Selesai
        </Button>
      </DialogFooter>
    </div>
  );

  const form = (
    <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
      {embedded ? (
        <DialogHeader>
          <DialogTitle>Tambah akun</DialogTitle>
          <DialogDescription>
            Pilih member dan durasi langganan.
          </DialogDescription>
        </DialogHeader>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {isAdmin ? (
        <div className="grid gap-2">
          <Label htmlFor="owner">Member</Label>
          <SearchableSelect
            id="owner"
            value={ownerMemberId}
            onValueChange={(id) => {
              setOwnerMemberId(id);
              setError(null);
            }}
            options={memberOptions}
            disabled={traders.length === 0}
            placeholder={
              traders.length === 0
                ? "Belum ada member aktif"
                : "Pilih member"
            }
            searchPlaceholder="Cari nama, email, atau ID trading…"
            emptyText="Member tidak ditemukan."
          />
        </div>
      ) : null}

      {isAdmin ? (
        <div className="grid gap-2">
          <Label htmlFor="duration">Durasi</Label>
          <Select
            value={durationMonths}
            onValueChange={(v) => setDurationMonths(v ?? "1")}
          >
            <SelectTrigger id="duration" className="w-full">
              <SelectValue placeholder="Pilih durasi" />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.months} value={String(opt.months)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Alert>
            <CalendarClockIcon />
            <AlertTitle>Expired</AlertTitle>
            <AlertDescription>
              {formatExpiryYmdLabel(expiresAtYmd)}
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div
        className={
          embedded
            ? "flex justify-end gap-2 border-t border-border/50 pt-4"
            : "flex justify-end gap-2"
        }
      >
        {embedded && onDone ? (
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={loading}
          >
            Batal
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={loading || (isAdmin && !ownerMemberId)}
        >
          {loading ? "Menyimpan…" : "Buat akun"}
        </Button>
      </div>
    </form>
  );

  const body = apiKey ? success : form;

  if (embedded) return body;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">{body}</CardContent>
    </Card>
  );
}
