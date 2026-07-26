import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { resolveBannerDiskPath } from "@/lib/home-banners";

type Params = { params: Promise<{ filename: string }> };

/**
 * Serve uploaded banners from disk (Docker volume).
 * next/image optimizer often fails on standalone + bind/volume mounts ("received null").
 */
export async function GET(_req: Request, { params }: Params) {
  const { filename } = await params;
  const diskPath = resolveBannerDiskPath(filename);
  if (!diskPath) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  try {
    const buf = await fs.readFile(diskPath);
    const lower = filename.toLowerCase();
    const contentType = lower.endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}
