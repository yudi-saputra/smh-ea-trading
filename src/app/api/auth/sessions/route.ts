import {
  getCurrentSessionId,
  getSessionToken,
  listUserSessions,
  requireUser,
  revokeAllUserSessions,
  revokeUserSession,
} from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { deviceLabelFromUa } from "@/lib/session-meta";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/crypto";

export async function GET() {
  try {
    const user = await requireUser();
    const currentId = await getCurrentSessionId();
    const rows = await listUserSessions(user.id);

    return jsonOk({
      sessions: rows.map((s) => ({
        id: s.id,
        device: deviceLabelFromUa(s.userAgent),
        ip: s.ip,
        createdAt: s.createdAt.toISOString(),
        lastSeenAt: (s.lastSeenAt ?? s.createdAt).toISOString(),
        current: s.id === currentId,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => null)) as {
      sessionId?: string;
      all?: boolean;
    } | null;

    if (body?.all) {
      await revokeAllUserSessions(user.id);
      const res = jsonOk({ ok: true, all: true });
      res.cookies.set(SESSION_COOKIE, "", {
        ...sessionCookieOptions(req),
        maxAge: 0,
      });
      return res;
    }

    const sessionId = body?.sessionId?.trim();
    if (!sessionId) return jsonError("sessionId required");

    const token = await getSessionToken();
    const result = await revokeUserSession(user.id, sessionId, token);
    if (!result.ok) return jsonError("Session not found", 404);

    const res = jsonOk({ ok: true, wasCurrent: result.wasCurrent });
    if (result.wasCurrent) {
      res.cookies.set(SESSION_COOKIE, "", {
        ...sessionCookieOptions(req),
        maxAge: 0,
      });
    }
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
