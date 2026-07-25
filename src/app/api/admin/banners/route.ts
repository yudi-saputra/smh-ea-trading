import { Role } from "@prisma/client";
import { AuthError, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import {
  addHomeBanner,
  listHomeBanners,
  setBannerIntervalSec,
} from "@/lib/home-banners";

export async function GET() {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }
    const { slides, intervalSec } = await listHomeBanners();
    return jsonOk({ ok: true, slides, intervalSec });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const body = (await req.json()) as { intervalSec?: number };
    if (typeof body.intervalSec !== "number") {
      return jsonError("intervalSec wajib (detik)", 400);
    }

    const intervalSec = await setBannerIntervalSec(body.intervalSec);
    return jsonOk({ ok: true, intervalSec });
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

    const form = await req.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") ?? "").trim();

    if (!(file instanceof File)) {
      return jsonError("File gambar wajib", 400);
    }
    if (
      file.type !== "image/jpeg" &&
      file.type !== "image/jpg" &&
      file.type !== "image/png"
    ) {
      return jsonError("Format harus JPG atau PNG (landscape)", 400);
    }
    // ~2.5MB ceiling
    if (file.size > 2.5 * 1024 * 1024) {
      return jsonError("Ukuran maksimal 2.5MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const slide = await addHomeBanner({
      buffer,
      mime: file.type,
      alt: alt || "Banner",
    });

    return jsonOk({ ok: true, slide });
  } catch (err) {
    return handleRouteError(err);
  }
}
