import { Role, MemberStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuthError, requireUser } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { parseMemberStatus } from "@/lib/members";
import { hashPassword } from "@/lib/crypto";
import { parsePasswordTrading } from "@/lib/password-trading";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await params;
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) return jsonError("Member tidak ditemukan", 404);

    const parsed = await parseJsonBody<{
      packageId?: string;
      name?: string;
      email?: string;
      password?: string;
      idTrading?: string;
      passwordTrading?: string;
      serverBroker?: string;
      status?: MemberStatus;
    }>(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const data: {
      packageId?: string;
      name?: string;
      email?: string;
      password?: string;
      idTrading?: string;
      passwordTrading?: string;
      serverBroker?: string;
      status?: MemberStatus;
    } = {};

    if (body.packageId !== undefined) {
      const packageId =
        typeof body.packageId === "string" ? body.packageId.trim() : "";
      if (!packageId) return jsonError("Paket wajib dipilih", 400);
      const pkg = await prisma.package.findUnique({ where: { id: packageId } });
      if (!pkg) return jsonError("Paket tidak ditemukan", 400);
      data.packageId = packageId;
    }

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return jsonError("Nama wajib diisi", 400);
      data.name = name;
    }

    if (body.email !== undefined) {
      const email =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) return jsonError("Email wajib diisi", 400);
      data.email = email;
    }

    if (body.password !== undefined) {
      const password =
        typeof body.password === "string" ? body.password.trim() : "";
      if (password) data.password = await hashPassword(password);
    }

    if (body.idTrading !== undefined) {
      const idTrading =
        typeof body.idTrading === "string" ? body.idTrading.trim() : "";
      if (!idTrading) return jsonError("ID Trading wajib diisi", 400);
      data.idTrading = idTrading;
    }

    if (body.passwordTrading !== undefined) {
      // empty string = leave unchanged (edit form pattern)
      if (
        typeof body.passwordTrading === "string" &&
        body.passwordTrading.trim()
      ) {
        const pw = parsePasswordTrading(body.passwordTrading);
        if (!pw.ok) return jsonError(pw.error, 400);
        data.passwordTrading = pw.value;
      }
    }

    if (body.serverBroker !== undefined) {
      const serverBroker =
        typeof body.serverBroker === "string" ? body.serverBroker.trim() : "";
      if (!serverBroker) return jsonError("Server Broker wajib diisi", 400);
      data.serverBroker = serverBroker;
    }

    if (body.status !== undefined) {
      const status = parseMemberStatus(body.status);
      if (!status) return jsonError("Status tidak valid", 400);
      data.status = status;
    }

    const member = await prisma.member.update({
      where: { id },
      data,
      select: memberSelect,
    });

    return jsonOk({ ok: true, member: { ...member, password: "" } });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireUser();
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await params;
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) return jsonError("Member tidak ditemukan", 404);

    await prisma.member.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
