/**
 * Verify Cloudflare Turnstile token.
 * When TURNSTILE_SECRET_KEY is unset, verification is skipped (local/dev).
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true };

  if (!token?.trim()) {
    return { ok: false, error: "Verifikasi keamanan wajib dilengkapi" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = (await res.json()) as { success?: boolean };
    if (!data.success) {
      return { ok: false, error: "Verifikasi keamanan gagal. Coba lagi." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal memverifikasi keamanan. Coba lagi." };
  }
}

export function turnstileSiteKey() {
  return process.env.TURNSTILE_SITE_KEY?.trim() || null;
}
