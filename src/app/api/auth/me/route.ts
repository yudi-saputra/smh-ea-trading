import { getSessionUser } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await getSessionUser();
    return jsonOk({ ok: true, user });
  } catch (err) {
    return handleRouteError(err);
  }
}
