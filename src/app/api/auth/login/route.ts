import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/crypto";
import { createSession } from "@/lib/auth";
import {
  clientIpFromRequest,
  userAgentFromRequest,
} from "@/lib/session-meta";
import { UserStatus } from "@prisma/client";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 30;
const LOGIN_IDENTITY_LIMIT = 10;

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req) ?? "unknown";
    const ipLimit = rateLimit(`auth:login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS);
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
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return jsonError("Email and password required");
    }

    const idLimit = rateLimit(
      `auth:login:id:${ip}:${email}`,
      LOGIN_IDENTITY_LIMIT,
      LOGIN_WINDOW_MS,
    );
    if (!idLimit.ok) {
      return jsonError("Terlalu banyak percobaan login. Coba lagi nanti.", 429, {
        headers: { "Retry-After": String(idLimit.retryAfterSec) },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      return jsonError("Invalid email or password", 401);
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return jsonError("Invalid email or password", 401);

    const { token, expiresAt } = await createSession(user.id, {
      userAgent: userAgentFromRequest(req),
      ip: clientIpFromRequest(req),
    });
    const res = jsonOk({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      ...sessionCookieOptions(req),
      expires: expiresAt,
    });

    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
