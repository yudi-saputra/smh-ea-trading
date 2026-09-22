import { Role, PackageStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuthError, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { parsePackageStatus } from "@/lib/packages";

const packageSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
} as const;

export async function GET() {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const packages = await prisma.package.findMany({
      select: packageSelect,
      orderBy: { name: "asc" },
    });

    return jsonOk({ ok: true, packages });
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
      name?: string;
      description?: string;
      status?: PackageStatus;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const name = body.name?.trim();
    if (!name) return jsonError("Nama wajib diisi", 400);

    const status = body.status
      ? parsePackageStatus(body.status)
      : PackageStatus.ACTIVE;
    if (!status) return jsonError("Status tidak valid", 400);

    const pkg = await prisma.package.create({
      data: {
        name,
        description: body.description?.trim() ?? "",
        status,
      },
      select: packageSelect,
    });

    return jsonOk({ ok: true, package: pkg });
  } catch (err) {
    return handleRouteError(err);
  }
}
