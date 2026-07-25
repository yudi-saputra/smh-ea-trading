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
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return jsonError("Email and password required");
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
