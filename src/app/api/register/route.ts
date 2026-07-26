import { MemberStatus, PackageStatus, AffiliateStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { clientIpFromRequest } from "@/lib/session-meta";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { normalizeAffiliateCode } from "@/lib/affiliates";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      packageId?: string;
      name?: string;
      email?: string;
      password?: string;
      idTrading?: string;
      passwordTrading?: string;
      serverBroker?: string;
      referralCode?: string;
      turnstileToken?: string;
    };

    const packageId = body.packageId?.trim();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const idTrading = body.idTrading?.trim();
    const passwordTrading = body.passwordTrading?.trim();
    const serverBroker = body.serverBroker?.trim();
    const referralCode = normalizeAffiliateCode(body.referralCode ?? "");

    const captcha = await verifyTurnstileToken(
      body.turnstileToken,
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
    if (!passwordTrading) return jsonError("Password Trading wajib diisi", 400);
    if (!serverBroker) return jsonError("Server Trading wajib diisi", 400);

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
