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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
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
  passwordTrading: string;
  serverBroker: string;
  packageId: string;
};

export type AccountPackageOption = {
  id: string;
  name: string;
};

export function CreateAccountForm({
  isAdmin,
  traders,
  packages = [],
  listHref = "/admin/account",
  embedded = false,
  onDone,
}: {
  isAdmin: boolean;
  traders: TraderOption[];
  packages?: AccountPackageOption[];
  listHref?: string;
  /** Skip Card wrapper — for use inside Dialog. */
  embedded?: boolean;
  /** Called after success dismiss (or instead of navigating to listHref). */
  onDone?: () => void;
}) {
  const router = useRouter();
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [terminalId, setTerminalId] = useState("");
  const [passwordTrading, setPasswordTrading] = useState("");
  const [serverBroker, setServerBroker] = useState("");
  const [accountName, setAccountName] = useState("");
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

  function onPickMember(id: string) {
    setOwnerMemberId(id);
    setError(null);
    const m = traders.find((t) => t.id === id);
    // Only suggest package; trading fields stay empty so multi-akun is entered manually.
    if (m?.packageId) setPackageId(m.packageId);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ownerMemberId) {
      setError("Pilih member terlebih dahulu");
      return;
    }
    if (!packageId) {
      setError("Pilih paket terlebih dahulu");
      return;
    }
    const tid = terminalId.trim();
    if (!tid) {
      setError("ID Trading wajib diisi");
      return;
    }
    if (!passwordTrading.trim()) {
      setError("Password Trading wajib diisi");
      return;
    }
    if (!serverBroker.trim()) {
      setError("Server Broker wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerMemberId,
          packageId,
          terminalId: tid,
          passwordTrading: passwordTrading.trim(),
          serverBroker: serverBroker.trim(),
          name: accountName.trim() || undefined,
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
            Salin ApiKey sekarang.
          </DialogDescription>
        </DialogHeader>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-medium">API Key</p>
          <p className="text-sm text-muted-foreground">
            Salin ApiKey
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
        <DialogHeader className="sm:col-span-2 mb-4">
          <DialogTitle>Tambah Akun</DialogTitle>
        </DialogHeader>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
        {isAdmin ? (
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="owner">Member</Label>
            <SearchableSelect
              id="owner"
              value={ownerMemberId}
              onValueChange={onPickMember}
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
            <Label htmlFor="package">Paket</Label>
            <Select
              value={packageId}
              onValueChange={(v) => setPackageId(v ?? "")}
              disabled={packages.length === 0}
            >
              <SelectTrigger id="package" className="w-full">
                <SelectValue
                  placeholder={
                    packages.length === 0
                      ? "Belum ada paket aktif"
                      : "Pilih paket"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="grid gap-2">
            <Label htmlFor="accountName">Label / Keterangan</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}

        {isAdmin ? (
          <div className="grid gap-2">
            <Label htmlFor="terminalId">ID Trading</Label>
            <Input
              id="terminalId"
              value={terminalId}
              onChange={(e) => setTerminalId(e.target.value)}
              autoComplete="off"
              required
              className="font-mono"
            />
          </div>
        ) : null}

        {isAdmin ? (
          <div className="grid gap-2">
            <Label htmlFor="passwordTrading">Password Trading</Label>
            <PasswordInput
              id="passwordTrading"
              value={passwordTrading}
              onChange={(e) => setPasswordTrading(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
        ) : null}

        {isAdmin ? (
          <div className="grid gap-2">
            <Label htmlFor="serverBroker">Server Broker</Label>
            <Input
              id="serverBroker"
              value={serverBroker}
              onChange={(e) => setServerBroker(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
        ) : null}

        {isAdmin ? (
          <div className="grid gap-2">
            <Label htmlFor="duration">Expired</Label>
            <Select
              value={durationMonths}
              onValueChange={(v) => setDurationMonths(v ?? "1")}
            >
              <SelectTrigger id="duration" className="w-full">
                <SelectValue placeholder="Pilih Expired" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.months} value={String(opt.months)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="sm:col-span-2">
            <Alert>
              <CalendarClockIcon />
              <AlertTitle>Expired - {formatExpiryYmdLabel(expiresAtYmd)}</AlertTitle>
            </Alert>
          </div>
        ) : null}
      </div>

      <div
        className={
          embedded
            ? "flex justify-end gap-2 border-t border-border/50 pt-4 sm:col-span-2"
            : "flex justify-end gap-2 sm:col-span-2"
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
          disabled={
            loading ||
            (isAdmin &&
              (!ownerMemberId ||
                !packageId ||
                !terminalId.trim() ||
                !passwordTrading.trim() ||
                !serverBroker.trim()))
          }
        >
          {loading ? "Menyimpan…" : "Simpan"}
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
