import { Role, PackageStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuthError, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { parsePackageStatus } from "@/lib/packages";

type Params = { params: Promise<{ id: string }> };

const packageSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
} as const;

export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await params;
    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) return jsonError("Package tidak ditemukan", 404);

    const body = (await req.json()) as {
      name?: string;
      description?: string;
      status?: PackageStatus;
    };

    const data: {
      name?: string;
      description?: string;
      status?: PackageStatus;
    } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return jsonError("Nama wajib diisi", 400);
      data.name = name;
    }

    if (body.description !== undefined) {
      data.description = body.description.trim();
    }

    if (body.status !== undefined) {
      const status = parsePackageStatus(body.status);
      if (!status) return jsonError("Status tidak valid", 400);
      data.status = status;
    }

    const pkg = await prisma.package.update({
      where: { id },
      data,
      select: packageSelect,
    });

    return jsonOk({ ok: true, package: pkg });
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
    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) return jsonError("Package tidak ditemukan", 404);

    await prisma.package.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
