import { MemberStatus, PackageStatus, AffiliateStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { clientIpFromRequest } from "@/lib/session-meta";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { normalizeAffiliateCode } from "@/lib/affiliates";
import { parsePasswordTrading } from "@/lib/password-trading";
import { rateLimit } from "@/lib/rate-limit";

const REGISTER_WINDOW_MS = 15 * 60 * 1000;
const REGISTER_IP_LIMIT = 5;

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req) ?? "unknown";
    const ipLimit = rateLimit(
      `register:ip:${ip}`,
      REGISTER_IP_LIMIT,
      REGISTER_WINDOW_MS,
    );
    if (!ipLimit.ok) {
      return jsonError(
        "Terlalu banyak percobaan pendaftaran. Coba lagi nanti.",
        429,
        { headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
      );
    }

    const parsed = await parseJsonBody<{
      packageId?: string;
      name?: string;
      email?: string;
      password?: string;
      idTrading?: string;
      passwordTrading?: string;
      serverBroker?: string;
      referralCode?: string;
      turnstileToken?: string;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const packageId =
      typeof body.packageId === "string" ? body.packageId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password.trim() : "";
    const idTrading =
      typeof body.idTrading === "string" ? body.idTrading.trim() : "";
    const pwTrading = parsePasswordTrading(
      typeof body.passwordTrading === "string" ? body.passwordTrading : "",
    );
    const serverBroker =
      typeof body.serverBroker === "string" ? body.serverBroker.trim() : "";
    const referralCode = normalizeAffiliateCode(
      typeof body.referralCode === "string" ? body.referralCode : "",
    );

    const captcha = await verifyTurnstileToken(
      typeof body.turnstileToken === "string" ? body.turnstileToken : undefined,
      clientIpFromRequest(req),
    );
    if (!captcha.ok) return jsonError(captcha.error, 400);

    if (!packageId) return jsonError("Paket wajib dipilih", 400);
    if (!name) return jsonError("Nama wajib diisi", 400);
    if (!email) return jsonError("Email wajib diisi", 400);
    if (!password) return jsonError("Password wajib diisi", 400);
    if (password.length < 6) {
      return jsonError("Password minimal 6 karakter", 400);
    }
    if (!idTrading) return jsonError("ID Trading wajib diisi", 400);
    if (!pwTrading.ok) return jsonError(pwTrading.error, 400);
    if (!serverBroker) return jsonError("Server Trading wajib diisi", 400);
    const passwordTrading = pwTrading.value;

    const pkg = await prisma.package.findFirst({
      where: { id: packageId, status: PackageStatus.ACTIVE },
    });
    if (!pkg) return jsonError("Paket tidak tersedia", 400);

    let affiliateId: string | null = null;
    if (referralCode) {
      const affiliate = await prisma.affiliate.findFirst({
        where: { code: referralCode, status: AffiliateStatus.ACTIVE },
        select: { id: true },
      });
      if (!affiliate) {
        return jsonError("Kode referral tidak valid atau nonaktif", 400);
      }
      affiliateId = affiliate.id;
    }

    const existing = await prisma.member.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return jsonError("Email sudah terdaftar", 409);

    await prisma.member.create({
      data: {
        packageId,
        affiliateId,
        name,
        email,
        password: await hashPassword(password),
        idTrading,
        passwordTrading,
        serverBroker,
        status: MemberStatus.INACTIVE,
      },
      select: { id: true },
    });

    return jsonOk({
      ok: true,
      message: "Pendaftaran berhasil. Akun menunggu aktivasi admin.",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
