import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

const DEFAULT_JSON_BODY_MAX = 1_048_576; // 1 MiB

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(
  message: string,
  status = 400,
  init?: Omit<ResponseInit, "status">,
) {
  return NextResponse.json(
    { ok: false, error: message },
    { ...init, status },
  );
}

/** Parse JSON object body; reject invalid JSON / oversized Content-Length. */
export async function parseJsonBody<T extends Record<string, unknown> = Record<string, unknown>>(
  req: Request,
  maxBytes = DEFAULT_JSON_BODY_MAX,
): Promise<
  { ok: true; data: T } | { ok: false; response: NextResponse }
> {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const n = Number(contentLength);
    if (Number.isFinite(n) && n > maxBytes) {
      return { ok: false, response: jsonError("Payload too large", 413) };
    }
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: jsonError("Invalid JSON", 400) };
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      response: jsonError("Body must be a JSON object", 400),
    };
  }

  return { ok: true, data: raw as T };
}

export function handleRouteError(err: unknown) {
  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
  }

  if (err instanceof SyntaxError) {
    return jsonError("Invalid JSON", 400);
  }

  console.error(err);

  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  ) {
    return jsonError("Data sudah ada (duplikat)", 409);
  }

  // Surface real cause in local/dev - "Internal server error" alone is useless.
  if (process.env.NODE_ENV !== "production" && err instanceof Error) {
    return jsonError(err.message, 500);
  }

  return jsonError("Internal server error", 500);
}
