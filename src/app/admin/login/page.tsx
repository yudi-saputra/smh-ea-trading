import type { Metadata } from "next";
import { AuthLoginForm } from "@/components/auth/login-form";
import { turnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = { title: "Login" };

// Runtime TURNSTILE_SITE_KEY; static build would bake an empty widget.
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthLoginForm
          variant="admin"
          turnstileSiteKey={turnstileSiteKey()}
        />
      </div>
    </div>
  );
}
