import { Role } from "@prisma/client";
import { AuthError, requireUser } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/api";
import { removeHomeBanner } from "@/lib/home-banners";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await ctx.params;
    const ok = await removeHomeBanner(id);
    if (!ok) {
      return jsonOk({ ok: false, error: "Banner tidak ditemukan" }, { status: 404 });
    }
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
