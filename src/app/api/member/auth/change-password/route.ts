import {
  MEMBER_SESSION_COOKIE,
  hashPassword,
  sessionCookieOptions,
} from "@/lib/crypto";
import {
  getMemberSessionToken,
  requireMember,
  revokeAllMemberSessions,
  verifyMemberPassword,
} from "@/lib/auth-member";
import { prisma } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const member = await requireMember();
    const parsed = await parseJsonBody<{
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword?.trim() ?? "";
    const confirmPassword = body.confirmPassword?.trim() ?? "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return jsonError("Semua field password wajib diisi");
    }
    if (newPassword.length < 6) {
      return jsonError("Password baru minimal 6 karakter");
    }
    if (newPassword !== confirmPassword) {
      return jsonError("Konfirmasi password tidak cocok");
    }
    if (currentPassword === newPassword) {
      return jsonError("Password baru harus berbeda dari password saat ini");
    }

    const row = await prisma.member.findUnique({ where: { id: member.id } });
    if (!row) return jsonError("Unauthorized", 401);

    const ok = await verifyMemberPassword(
      row.id,
      currentPassword,
      row.password,
    );
    if (!ok) return jsonError("Password lama salah", 401);

    await prisma.member.update({
      where: { id: member.id },
      data: { password: await hashPassword(newPassword) },
    });

    await revokeAllMemberSessions(member.id);

    const res = jsonOk({ ok: true });
    res.cookies.set(MEMBER_SESSION_COOKIE, "", {
      ...sessionCookieOptions(req),
      expires: new Date(0),
    });
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
