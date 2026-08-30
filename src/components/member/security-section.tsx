"use client";

import { useState } from "react";
import {
  ChevronRightIcon,
  LockIcon,
  SaveIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MemberLoginSessions } from "@/components/member/login-sessions";
import { MemberThemeMenu } from "@/components/member/profile";

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="type-body">
        {label}
      </Label>
      <PasswordInput
        id={id}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl"
      />
    </div>
  );
}

export function MemberSecuritySection() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setLoading(false);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/member/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah password");
        return;
      }
      onOpenChange(false);
    } catch {
      setError("Koneksi gagal, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-2">
      <h3 className="type-ui font-semibold tracking-tight">Menu</h3>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-accent/30"
            >
              <LockIcon
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="type-ui min-w-0 flex-1 font-medium">
                Ubah Password
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/70" />
            </button>
          </DrawerTrigger>

          <DrawerContent className="mx-auto w-full max-w-[430px] md:max-w-[768px]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Ubah Password</DrawerTitle>
              <DrawerDescription>
                Masukkan password saat ini, lalu tentukan password baru.
              </DrawerDescription>
            </DrawerHeader>

            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-4 overflow-y-auto px-4 pb-6"
            >
              {error ? (
                <p className="type-body rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-destructive">
                  {error}
                </p>
              ) : null}

              <PasswordField
                id="current-password"
                label="Password saat ini"
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />

              <PasswordField
                id="new-password"
                label="Password baru"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={setNewPassword}
              />

              <PasswordField
                id="confirm-password"
                label="Konfirmasi password baru"
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              <DrawerFooter className="gap-2 px-0">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full gap-2 rounded-xl"
                >
                  <SaveIcon className="size-4" aria-hidden />
                  {loading ? "Menyimpan…" : "Simpan Password"}
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </Drawer>
        <MemberLoginSessions />
        <MemberThemeMenu />
      </div>
    </section>
  );
}
