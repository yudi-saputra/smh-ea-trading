import { cookies } from "next/headers";
import { destroySession } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/crypto";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) await destroySession(token);

    const res = jsonOk({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions(req),
      maxAge: 0,
    });
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
