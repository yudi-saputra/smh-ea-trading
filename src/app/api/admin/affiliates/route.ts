import { Role, AffiliateStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuthError, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import {
  AFFILIATE_CODE_RE,
  normalizeAffiliateCode,
  parseAffiliateStatus,
} from "@/lib/affiliates";

const affiliateSelect = {
  id: true,
  code: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  notes: true,
  createdAt: true,
  _count: { select: { members: true } },
} as const;

export async function GET() {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const affiliates = await prisma.affiliate.findMany({
      select: affiliateSelect,
      orderBy: { name: "asc" },
    });

    return jsonOk({
      ok: true,
      affiliates: affiliates.map((a) => ({
        ...a,
        memberCount: a._count.members,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const parsed = await parseJsonBody<{
      code?: string;
      name?: string;
      email?: string;
      phone?: string;
      notes?: string;
      status?: AffiliateStatus;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const code = normalizeAffiliateCode(body.code ?? "");
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim() || null;
    const notes = body.notes?.trim() ?? "";

    if (!code) return jsonError("Kode referral wajib diisi", 400);
    if (!AFFILIATE_CODE_RE.test(code)) {
      return jsonError("Kode harus 2-32 karakter [A-Z0-9_-]", 400);
    }
    if (!name) return jsonError("Nama wajib diisi", 400);
    if (!email) return jsonError("Email wajib diisi", 400);

    const status = body.status
      ? parseAffiliateStatus(body.status)
      : AffiliateStatus.ACTIVE;
    if (!status) return jsonError("Status tidak valid", 400);

    const duplicate = await prisma.affiliate.findFirst({
      where: { OR: [{ code }, { email }] },
      select: { code: true, email: true },
    });
    if (duplicate?.code === code) {
      return jsonError("Kode referral sudah dipakai", 409);
    }
    if (duplicate?.email === email) {
      return jsonError("Email sudah terdaftar", 409);
    }

    const affiliate = await prisma.affiliate.create({
      data: { code, name, email, phone, notes, status },
      select: affiliateSelect,
    });

    return jsonOk(
      {
        ok: true,
        affiliate: {
          ...affiliate,
          memberCount: affiliate._count.members,
          createdAt: affiliate.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
