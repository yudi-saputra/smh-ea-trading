import { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  AuthError,
  canCreateStaffOrAdmin,
  canCreateTrader,
  canListUsers,
  requireUser,
} from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const actor = await requireUser();
    if (!canListUsers(actor.role)) {
      throw new AuthError("Forbidden", 403);
    }

    const users = await prisma.user.findMany({
      where:
        actor.role === Role.STAFF
          ? { role: Role.TRADER }
          : undefined,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        displayName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ ok: true, users });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireUser();
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: Role;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const role = body.role ?? Role.TRADER;
    const displayName = body.displayName?.trim() || null;

    if (!email || !password) {
      return jsonError("Email and password required");
    }
    if (password.length < 6) {
      return jsonError("Password min 6 characters");
    }

    if (role === Role.TRADER) {
      if (!canCreateTrader(actor.role)) throw new AuthError("Forbidden", 403);
    } else if (role === Role.STAFF || role === Role.SUPER_ADMIN) {
      if (!canCreateStaffOrAdmin(actor.role)) {
        throw new AuthError("Forbidden", 403);
      }
    } else {
      return jsonError("Invalid role");
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return jsonError("Email already registered", 409);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role,
        status: UserStatus.ACTIVE,
        displayName,
        createdById: actor.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        displayName: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "users.create",
        meta: { userId: user.id, role: user.role },
      },
    });

    return jsonOk({ ok: true, user }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
