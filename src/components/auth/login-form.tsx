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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SmhLogo } from "@/components/shared/smh-logo";
import {
  TurnstileField,
  resetTurnstile,
} from "@/components/auth/turnstile-field";

function adminHomePath(role: string | undefined) {
  if (role === "STAFF") return "/admin/users";
  return "/admin";
}

/**
 * SEC-01 - Validate the ?next= redirect param to prevent open redirect.
 *
 * Rules:
 * - Must start with "/" (relative path only - no absolute URLs)
 * - Must NOT start with "//" (protocol-relative URL pointing to external host)
 * - Must NOT contain "://" (absolute URL smuggled after a slash)
 * - For admin logins: must start with "/admin"
 * - For member logins: must NOT start with "/admin"
 *
 * Returns null when invalid; caller should fall back to the default path.
 */
function safeNextPath(
  raw: string | null,
  variant: "member" | "admin",
): string | null {
  if (!raw) return null;
  // Must be a relative path starting with a single slash.
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  // Block smuggled absolute URLs like /https://evil.com.
  if (raw.includes("://")) return null;
  // Keep each variant within its own area.
  if (variant === "admin" && !raw.startsWith("/admin")) return null;
  if (variant === "member" && raw.startsWith("/admin")) return null;
  return raw;
}

export function AuthLoginForm({
  className,
  variant = "member",
  turnstileSiteKey,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "member" | "admin";
  turnstileSiteKey?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isAdmin = variant === "admin";
  const needCaptcha = Boolean(turnstileSiteKey);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (needCaptcha && !turnstileToken) {
      setError("Lengkapi verifikasi keamanan terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        isAdmin ? "/api/auth/login" : "/api/member/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, turnstileToken }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setTurnstileToken(null);
        resetTurnstile();
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const nextPath = safeNextPath(params.get("next"), variant);
      const defaultPath = isAdmin ? adminHomePath(data.user?.role) : "/member";
      window.location.assign(nextPath ?? defaultPath);
    } catch {
      setError("Network error");
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
            <CardTitle className="type-display text-xl">
              {isAdmin ? "Welcome back" : "Welcome back"}
            </CardTitle>
            <CardDescription>Strategic Market Handler</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              {error ? (
                <p className="type-body rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-destructive">
                  {error}
                </p>
              ) : null}

              <Field>
                <FieldLabel htmlFor="email" className="type-body font-medium">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="h-12 w-full rounded-lg px-3.5 text-base md:h-11 md:text-(length:--type-title)"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="type-body font-medium">
                  Password
                </FieldLabel>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 w-full rounded-lg px-3.5 text-base md:h-11 md:text-(length:--type-title)"
                />
              </Field>

              {turnstileSiteKey ? (
                <TurnstileField
                  siteKey={turnstileSiteKey}
                  onToken={setTurnstileToken}
                />
              ) : null}

              <Field>
                <Button
                  type="submit"
                  disabled={loading || (needCaptcha && !turnstileToken)}
                  className="type-title mt-2 h-12 w-full rounded-lg"
                >
                  {loading ? "Loading…" : "Sign in"}
                </Button>
              </Field>

              {isAdmin ? null : (
                <p className="text-center text-sm text-muted-foreground">
                  Belum punya akun?{" "}
                  <Link
                    href="/member/register"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Daftar member
                  </Link>
                </p>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground text-balance">
        Copyright © {new Date().getFullYear()} Strategic Market Handler. All rights
        reserved.
      </p>
    </div>
  );
}
