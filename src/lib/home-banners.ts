import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type HomeBannerSlide = {
  id: string;
  src: string;
  alt: string;
  createdAt: string;
};

export type BannerStore = {
  slides: HomeBannerSlide[];
  /** Auto-advance interval in seconds (Home carousel). */
  intervalSec: number;
};

const DEFAULT_INTERVAL_SEC = 5;
const MIN_INTERVAL_SEC = 2;
const MAX_INTERVAL_SEC = 60;

const PLACEHOLDER: HomeBannerSlide = {
  id: "placeholder",
  src: "/placeholder.svg",
  alt: "Banner",
  createdAt: new Date(0).toISOString(),
};

const DATA_PATH = path.join(process.cwd(), "data", "home-banners.json");
const BANNERS_DIR = path.join(process.cwd(), "public", "banners");

function clampInterval(sec: number) {
  if (!Number.isFinite(sec)) return DEFAULT_INTERVAL_SEC;
  return Math.min(MAX_INTERVAL_SEC, Math.max(MIN_INTERVAL_SEC, Math.round(sec)));
}

async function ensureStore(): Promise<BannerStore> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<BannerStore>;
    return {
      slides: Array.isArray(parsed.slides) ? parsed.slides : [],
      intervalSec: clampInterval(
        typeof parsed.intervalSec === "number"
          ? parsed.intervalSec
          : DEFAULT_INTERVAL_SEC,
      ),
    };
  } catch {
    return { slides: [], intervalSec: DEFAULT_INTERVAL_SEC };
  }
}

async function writeStore(store: BannerStore) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(
    DATA_PATH,
    JSON.stringify(
      {
        intervalSec: clampInterval(store.intervalSec),
        slides: store.slides,
      },
      null,
      2,
    ),
    "utf8",
  );
}

export async function getHomeBannerConfig(): Promise<{
  slides: HomeBannerSlide[];
  intervalSec: number;
}> {
  const store = await ensureStore();
  return {
    slides: store.slides.length === 0 ? [PLACEHOLDER] : store.slides,
    intervalSec: store.intervalSec,
  };
}

/** @deprecated prefer getHomeBannerConfig */
export async function getHomeBannerSlides(): Promise<HomeBannerSlide[]> {
  const { slides } = await getHomeBannerConfig();
  return slides;
}

export async function listHomeBanners(): Promise<{
  slides: HomeBannerSlide[];
  intervalSec: number;
}> {
  const store = await ensureStore();
  return { slides: store.slides, intervalSec: store.intervalSec };
}

export async function setBannerIntervalSec(sec: number): Promise<number> {
  const store = await ensureStore();
  store.intervalSec = clampInterval(sec);
  await writeStore(store);
  return store.intervalSec;
}

export async function addHomeBanner(file: {
  buffer: Buffer;
  mime: string;
  alt?: string;
}): Promise<HomeBannerSlide> {
  const ext =
    file.mime === "image/png"
      ? "png"
      : file.mime === "image/jpeg" || file.mime === "image/jpg"
        ? "jpg"
        : null;
  if (!ext) {
    throw new Error("Hanya JPG dan PNG yang diizinkan");
  }

  await fs.mkdir(BANNERS_DIR, { recursive: true });
  const id = randomBytes(8).toString("hex");
  const filename = `${id}.${ext}`;
  const diskPath = path.join(BANNERS_DIR, filename);
  await fs.writeFile(diskPath, file.buffer);

  const slide: HomeBannerSlide = {
    id,
    src: `/banners/${filename}`,
    alt: file.alt?.trim() || "Banner",
    createdAt: new Date().toISOString(),
  };

  const store = await ensureStore();
  store.slides.push(slide);
  await writeStore(store);
  return slide;
}

export async function removeHomeBanner(id: string): Promise<boolean> {
  const store = await ensureStore();
  const slide = store.slides.find((s) => s.id === id);
  if (!slide) return false;

  store.slides = store.slides.filter((s) => s.id !== id);
  await writeStore(store);

  if (slide.src.startsWith("/banners/")) {
    const diskPath = path.join(process.cwd(), "public", slide.src);
    await fs.unlink(diskPath).catch(() => {});
  }
  return true;
}

export { DEFAULT_INTERVAL_SEC, MIN_INTERVAL_SEC, MAX_INTERVAL_SEC };
