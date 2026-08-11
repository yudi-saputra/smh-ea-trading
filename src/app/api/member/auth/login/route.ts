import { MemberStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  MEMBER_SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/crypto";
import {
  createMemberSession,
  verifyMemberPassword,
} from "@/lib/auth-member";
import {
  clientIpFromRequest,
  userAgentFromRequest,
} from "@/lib/session-meta";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 30;
const LOGIN_IDENTITY_LIMIT = 10;

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req) ?? "unknown";
    const ipLimit = rateLimit(
      `member:login:ip:${ip}`,
      LOGIN_IP_LIMIT,
      LOGIN_WINDOW_MS,
    );
    if (!ipLimit.ok) {
      return jsonError("Terlalu banyak percobaan login. Coba lagi nanti.", 429, {
        headers: { "Retry-After": String(ipLimit.retryAfterSec) },
      });
    }

    const parsed = await parseJsonBody<{
      email?: string;
      password?: string;
      turnstileToken?: string;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const captcha = await verifyTurnstileToken(
      typeof body.turnstileToken === "string" ? body.turnstileToken : undefined,
      clientIpFromRequest(req),
    );
    if (!captcha.ok) return jsonError(captcha.error, 400);

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    // Match register hashing (trimmed). Autofill in PWA sometimes adds stray whitespace.
    const password =
      typeof body.password === "string" ? body.password.trim() : "";

    if (!email || !password) {
      return jsonError("Email and password required");
    }

    const idLimit = rateLimit(
      `member:login:id:${ip}:${email}`,
      LOGIN_IDENTITY_LIMIT,
      LOGIN_WINDOW_MS,
    );
    if (!idLimit.ok) {
      return jsonError("Terlalu banyak percobaan login. Coba lagi nanti.", 429, {
        headers: { "Retry-After": String(idLimit.retryAfterSec) },
      });
    }

    const member = await prisma.member.findUnique({ where: { email } });
    if (!member) {
      return jsonError("Invalid email or password", 401);
    }

    const ok = await verifyMemberPassword(member.id, password, member.password);
    if (!ok) return jsonError("Invalid email or password", 401);

    if (member.status !== MemberStatus.ACTIVE) {
      return jsonError(
        "Akun belum aktif. Hubungi admin untuk aktivasi.",
        403,
      );
    }

    const { token, expiresAt } = await createMemberSession(member.id, {
      userAgent: userAgentFromRequest(req),
      ip: clientIpFromRequest(req),
    });

    const res = jsonOk({
      ok: true,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
      },
    });

    res.cookies.set(MEMBER_SESSION_COOKIE, token, {
      ...sessionCookieOptions(req),
      expires: expiresAt,
    });

    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
