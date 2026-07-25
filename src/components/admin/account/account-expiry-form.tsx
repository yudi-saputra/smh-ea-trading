"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toExpiryDateInput } from "@/lib/expiry";

export function AccountExpiryForm({
  terminalId,
  expiresAt,
}: {
  terminalId: string;
  expiresAt: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(toExpiryDateInput(expiresAt));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(next: string | null) {
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/account/${terminalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memperbarui expiry");
        return;
      }
      setValue(toExpiryDateInput(data.terminal?.expiresAt ?? null));
      setSaved(true);
      router.refresh();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void save(value.trim() || null);
      }}
    >
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Expiry tersimpan — EA mengambilnya pada heartbeat berikutnya.
        </p>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="expiresAt">Tanggal kedaluwarsa (WIB)</FieldLabel>
          <DatePicker
            id="expiresAt"
            value={value}
            onChange={setValue}
            placeholder="Tanpa batas"
          />
          <p className="text-xs text-muted-foreground">
            Kosongkan jika tanpa batas. Berakhir pukul 23:59:59 WIB
            (Asia/Jakarta).
          </p>
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan…" : "Simpan expiry"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading || !value}
            onClick={() => void save(null)}
          >
            Hapus expiry
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
