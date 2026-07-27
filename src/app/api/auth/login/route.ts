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
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return jsonError("Email and password required");
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
