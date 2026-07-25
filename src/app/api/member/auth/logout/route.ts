import {
  MEMBER_SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/crypto";
import {
  destroyMemberSession,
  getMemberSessionToken,
} from "@/lib/auth-member";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const token = await getMemberSessionToken();
    if (token) await destroyMemberSession(token);

    const res = jsonOk({ ok: true });
    res.cookies.set(MEMBER_SESSION_COOKIE, "", {
      ...sessionCookieOptions(req),
      expires: new Date(0),
    });
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
