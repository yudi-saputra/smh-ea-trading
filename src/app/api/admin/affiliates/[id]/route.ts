import { Role, AffiliateStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuthError, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import {
  AFFILIATE_CODE_RE,
  normalizeAffiliateCode,
  parseAffiliateStatus,
} from "@/lib/affiliates";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await params;
    const existing = await prisma.affiliate.findUnique({ where: { id } });
    if (!existing) return jsonError("Afiliator tidak ditemukan", 404);

    const body = (await req.json()) as {
      code?: string;
      name?: string;
      email?: string;
      phone?: string | null;
      notes?: string;
      status?: AffiliateStatus;
    };

    const data: {
      code?: string;
      name?: string;
      email?: string;
      phone?: string | null;
      notes?: string;
      status?: AffiliateStatus;
    } = {};

    if (body.code !== undefined) {
      const code = normalizeAffiliateCode(body.code);
      if (!code) return jsonError("Kode referral wajib diisi", 400);
      if (!AFFILIATE_CODE_RE.test(code)) {
        return jsonError("Kode harus 2-32 karakter [A-Z0-9_-]", 400);
      }
      data.code = code;
    }

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return jsonError("Nama wajib diisi", 400);
      data.name = name;
    }

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      if (!email) return jsonError("Email wajib diisi", 400);
      data.email = email;
    }

    if (body.phone !== undefined) {
      data.phone = body.phone?.trim() || null;
    }

    if (body.notes !== undefined) {
      data.notes = body.notes.trim();
    }

    if (body.status !== undefined) {
      const status = parseAffiliateStatus(body.status);
      if (!status) return jsonError("Status tidak valid", 400);
      data.status = status;
    }

    if (data.code || data.email) {
      const clash = await prisma.affiliate.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.code ? [{ code: data.code }] : []),
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
        select: { code: true, email: true },
      });
      if (clash && data.code && clash.code === data.code) {
        return jsonError("Kode referral sudah dipakai", 409);
      }
      if (clash && data.email && clash.email === data.email) {
        return jsonError("Email sudah terdaftar", 409);
      }
    }

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data,
      select: affiliateSelect,
    });

    return jsonOk({
      ok: true,
      affiliate: {
        ...affiliate,
        memberCount: affiliate._count.members,
        createdAt: affiliate.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await params;
    const existing = await prisma.affiliate.findUnique({
      where: { id },
      select: { id: true, _count: { select: { members: true } } },
    });
    if (!existing) return jsonError("Afiliator tidak ditemukan", 404);

    // Members keep rows; FK onDelete SetNull clears affiliateId.
    await prisma.affiliate.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
