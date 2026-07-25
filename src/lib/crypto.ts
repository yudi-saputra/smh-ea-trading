import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  displayName: string | null;
};

export type SessionMember = {
  id: string;
  email: string;
  name: string;
};

export const SESSION_COOKIE = "smh_session";
export const MEMBER_SESSION_COOKIE = "smh_member_session";
const SESSION_DAYS = 14;

export function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

/** Cookie flags for localhost + reverse-proxy/tunnel (Cloudflare) HTTPS. */
export function sessionCookieOptions(req?: Request) {
  const forwarded = req?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwarded ??
    (req ? new URL(req.url).protocol.replace(":", "") : undefined);
  // Tunnel serves HTTPS while next dev stays NODE_ENV=development.
  const secure = proto === "https" || process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateApiKey() {
  // smh_live_<48 hex chars>
  return `smh_live_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

/** AES-256 key from API_KEY_SECRET, or derived from DATABASE_URL for local/dev. */
function apiKeyEncryptionKey() {
  const secret =
    process.env.API_KEY_SECRET?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "smh-dev-api-key-secret";
  return createHash("sha256").update(secret).digest();
}

/** Encrypt ApiKey for Super Admin reveal. Format: iv.tag.ciphertext (base64). */
export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", apiKeyEncryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptApiKey(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const [ivB64, tagB64, dataB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      apiKeyEncryptionKey(),
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

export const TERMINAL_ID_RE = /^[A-Za-z0-9_-]+$/;
