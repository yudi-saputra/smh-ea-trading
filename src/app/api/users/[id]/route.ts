import { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  AuthError,
  canManageUsersAdmin,
  requireUser,
} from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  displayName: true,
  createdAt: true,
} as const;

export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireUser();
    if (!canManageUsersAdmin(actor.role)) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await params;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return jsonError("User not found", 404);

    const body = (await req.json()) as {
      email?: string;
      displayName?: string;
      role?: Role;
      status?: UserStatus;
      password?: string;
    };

    const data: {
      email?: string;
      displayName?: string | null;
      role?: Role;
      status?: UserStatus;
      passwordHash?: string;
    } = {};

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      if (!email) return jsonError("Email required");
      if (email !== target.email) {
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return jsonError("Email already registered", 409);
        data.email = email;
      }
    }

    if (body.displayName !== undefined) {
      data.displayName = body.displayName.trim() || null;
    }

    if (body.role !== undefined) {
      if (!Object.values(Role).includes(body.role)) {
        return jsonError("Invalid role");
      }
      if (body.role !== target.role) {
        if (target.id === actor.id) {
          return jsonError("Cannot change your own role");
        }
        data.role = body.role;
      }
    }

    if (body.status !== undefined) {
      if (!Object.values(UserStatus).includes(body.status)) {
        return jsonError("Invalid status");
      }
      if (body.status !== target.status) {
        if (target.id === actor.id) {
          return jsonError("Cannot change your own status");
        }
        data.status = body.status;
      }
    }

    if (body.password) {
      if (body.password.length < 6) {
        return jsonError("Password min 6 characters");
      }
      data.passwordHash = await hashPassword(body.password);
    }

    if (Object.keys(data).length === 0) {
      return jsonOk({ ok: true, user: target });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    if (data.status === UserStatus.DISABLED) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "users.update",
        meta: { userId: user.id, fields: Object.keys(data) },
      },
    });

    return jsonOk({ ok: true, user });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireUser();
    if (!canManageUsersAdmin(actor.role)) {
      throw new AuthError("Forbidden", 403);
    }

    const { id } = await params;
    if (id === actor.id) {
      return jsonError("Cannot delete your own account", 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return jsonError("User not found", 404);

    const [ownedTerminals, createdTerminals] = await Promise.all([
      prisma.terminal.count({ where: { ownerUserId: id } }),
      prisma.terminal.count({ where: { createdById: id } }),
    ]);
    if (ownedTerminals > 0 || createdTerminals > 0) {
      return jsonError(
        "User masih terkait terminal. Pindahkan atau hapus terminalnya dulu.",
        409,
      );
    }

    await prisma.$transaction([
      prisma.command.updateMany({
        where: { actorUserId: id },
        data: { actorUserId: null },
      }),
      prisma.auditLog.updateMany({
        where: { actorUserId: id },
        data: { actorUserId: null },
      }),
      prisma.user.updateMany({
        where: { createdById: id },
        data: { createdById: null },
      }),
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "users.delete",
        meta: { userId: id, email: target.email },
      },
    });

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
