import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
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

  // Surface real cause in local/dev — "Internal server error" alone is useless.
  if (process.env.NODE_ENV !== "production" && err instanceof Error) {
    return jsonError(err.message, 500);
  }

  return jsonError("Internal server error", 500);
}
