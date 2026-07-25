import { Role, MemberStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuthError, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { parseMemberStatus } from "@/lib/members";
import { hashPassword } from "@/lib/crypto";

const memberSelect = {
  id: true,
  packageId: true,
  name: true,
  email: true,
  idTrading: true,
  passwordTrading: true,
  serverBroker: true,
  status: true,
  package: { select: { id: true, name: true } },
} as const;

export async function GET() {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const members = await prisma.member.findMany({
      select: memberSelect,
      orderBy: { name: "asc" },
    });

    return jsonOk({
      ok: true,
      members: members.map((m) => ({ ...m, password: "" })),
    });
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

    const body = (await req.json()) as {
      packageId?: string;
      name?: string;
      email?: string;
      password?: string;
      idTrading?: string;
      passwordTrading?: string;
      serverBroker?: string;
      status?: MemberStatus;
    };

    const packageId = body.packageId?.trim();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const idTrading = body.idTrading?.trim();
    const passwordTrading = body.passwordTrading?.trim();
    const serverBroker = body.serverBroker?.trim();

    if (!packageId) return jsonError("Paket wajib dipilih", 400);
    if (!name) return jsonError("Nama wajib diisi", 400);
    if (!email) return jsonError("Email wajib diisi", 400);
    if (!password) return jsonError("Password wajib diisi", 400);
    if (!idTrading) return jsonError("ID Trading wajib diisi", 400);
    if (!passwordTrading) return jsonError("Password Trading wajib diisi", 400);
    if (!serverBroker) return jsonError("Server Broker wajib diisi", 400);

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return jsonError("Paket tidak ditemukan", 400);

    const status = body.status
      ? parseMemberStatus(body.status)
      : MemberStatus.ACTIVE;
    if (!status) return jsonError("Status tidak valid", 400);

    const member = await prisma.member.create({
      data: {
        packageId,
        name,
        email,
        password: await hashPassword(password),
        idTrading,
        passwordTrading,
        serverBroker,
        status,
      },
      select: memberSelect,
    });

    return jsonOk({ ok: true, member: { ...member, password: "" } });
  } catch (err) {
    return handleRouteError(err);
  }
}
