import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  hashPassword,
  hashToken,
  verifyPassword,
} from "@/lib/crypto";
import { requireUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = await parseJsonBody<{
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

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

    const record = await prisma.user.findUnique({ where: { id: user.id } });
    if (!record) return jsonError("User not found", 404);

    const ok = await verifyPassword(currentPassword, record.passwordHash);
    if (!ok) return jsonError("Password saat ini salah", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
      const currentHash = hashToken(token);
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          NOT: { tokenHash: currentHash },
        },
      });
    }

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
