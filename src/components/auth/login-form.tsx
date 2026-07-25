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

function adminHomePath(role: string | undefined) {
  if (role === "STAFF") return "/admin/users";
  return "/admin";
}

export function AuthLoginForm({
  className,
  variant = "member",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "member" | "admin";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isAdmin = variant === "admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        isAdmin ? "/api/auth/login" : "/api/member/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      window.location.assign(
        isAdmin ? adminHomePath(data.user?.role) : "/member",
      );
    } catch {
      setError("Network error");
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
            <CardDescription>
              {isAdmin
                ? "SMH Control Panel"
                : "SMH Portal Member"}
            </CardDescription>
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

              <Field>
                <Button
                  type="submit"
                  disabled={loading}
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
        Copyright © 2026 SMH. All rights reserved.
      </p>
    </div>
  );
}
