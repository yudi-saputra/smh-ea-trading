"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SmhLogo } from "@/components/shared/smh-logo";
import {
  TurnstileField,
  resetTurnstile,
} from "@/components/auth/turnstile-field";

export type RegisterPackageOption = {
  id: string;
  name: string;
};

type FormValues = {
  packageId: string;
  name: string;
  email: string;
  password: string;
  idTrading: string;
  passwordTrading: string;
  serverBroker: string;
  referralCode: string;
};

export function AuthRegisterForm({
  packages,
  turnstileSiteKey,
  initialReferralCode = "",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  packages: RegisterPackageOption[];
  turnstileSiteKey?: string | null;
  /** Prefill from ?ref=KODE */
  initialReferralCode?: string;
}) {
  const [form, setForm] = useState<FormValues>({
    packageId: packages[0]?.id ?? "",
    name: "",
    email: "",
    password: "",
    idTrading: "",
    passwordTrading: "",
    serverBroker: "",
    referralCode: initialReferralCode,
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function patch(next: Partial<FormValues>) {
    setForm((f) => ({ ...f, ...next }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (turnstileSiteKey && !turnstileToken) {
      setError("Lengkapi verifikasi keamanan terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Pendaftaran gagal");
        setTurnstileToken(null);
        resetTurnstile();
        return;
      }
      setSuccess(
        data.message ??
          "Pendaftaran berhasil. Silahkan Konfirmasi Admin untuk aktivasi akun anda.",
      );
      setForm({
        packageId: packages[0]?.id ?? "",
        name: "",
        email: "",
        password: "",
        idTrading: "",
        passwordTrading: "",
        serverBroker: "",
        referralCode: initialReferralCode,
      });
      setTurnstileToken(null);
    } catch {
      setError("Kesalahan jaringan");
      setTurnstileToken(null);
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="justify-items-center gap-4 text-center">
          <SmhLogo size={80} priority className="justify-self-center" />
          <div className="flex flex-col items-center gap-1.5">
            <CardTitle className="type-display text-xl">Daftar Member</CardTitle>
            <CardDescription>
              Lengkapi informasi pribadi dan detail trading anda.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="grid gap-4">
              <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2.5 text-sm text-foreground">
                {success}
              </p>
              <Button asChild className="h-12 w-full rounded-lg">
                <Link href="/member/login">Kembali ke login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
              {error ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              {packages.length === 0 ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  Belum ada paket tersedia. Hubungi admin.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="reg-name">Nama</Label>
                    <Input
                      id="reg-name"
                      required
                      value={form.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => patch({ email: e.target.value })}
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <PasswordInput
                      id="reg-password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => patch({ password: e.target.value })}
                      autoComplete="new-password"
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-package">Paket</Label>
                    <Select
                      value={form.packageId || undefined}
                      onValueChange={(packageId) => patch({ packageId })}
                    >
                      <SelectTrigger id="reg-package" className="h-11 w-full">
                        <SelectValue placeholder="Pilih paket" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-idTrading">ID Trading</Label>
                    <Input
                      id="reg-idTrading"
                      required
                      value={form.idTrading}
                      onChange={(e) => patch({ idTrading: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-passwordTrading">Password Trading</Label>
                    <PasswordInput
                      id="reg-passwordTrading"
                      required
                      value={form.passwordTrading}
                      onChange={(e) =>
                        patch({ passwordTrading: e.target.value })
                      }
                      autoComplete="new-password"
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="reg-serverBroker">Server Broker</Label>
                    <Input
                      id="reg-serverBroker"
                      required
                      value={form.serverBroker}
                      onChange={(e) => patch({ serverBroker: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="reg-referral">
                      Kode referral{" "}
                      <span className="font-normal text-muted-foreground">
                        (opsional)
                      </span>
                    </Label>
                    <Input
                      id="reg-referral"
                      value={form.referralCode}
                      onChange={(e) =>
                        patch({ referralCode: e.target.value.toUpperCase() })
                      }
                      className="h-11"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              {turnstileSiteKey ? (
                <TurnstileField
                  siteKey={turnstileSiteKey}
                  onToken={setTurnstileToken}
                />
              ) : null}

              <Button
                type="submit"
                disabled={
                  loading ||
                  packages.length === 0 ||
                  Boolean(turnstileSiteKey && !turnstileToken)
                }
                className="type-title mt-2 h-12 w-full rounded-lg"
              >
                {loading ? "Mendaftar…" : "Daftar"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link
                  href="/member/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Masuk
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground text-balance">
        Copyright © 2026 SMH. All rights reserved.
      </p>
    </div>
  );
}
