import { cookies } from "next/headers";
import { Role, UserStatus, type User } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  generateSessionToken,
  hashToken,
  sessionExpiryDate,
  type SessionUser,
} from "@/lib/crypto";

export type AuthUser = SessionUser;

const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  };
}

export type CreateSessionMeta = {
  userAgent?: string | null;
  ip?: string | null;
};

export async function createSession(
  userId: string,
  meta: CreateSessionMeta = {},
) {
  const token = generateSessionToken();
  const expiresAt = sessionExpiryDate();
  const now = new Date();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
      lastSeenAt: now,
    },
  });
  return { token, expiresAt };
}

export async function destroySession(token: string) {
  await prisma.session.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}

function touchLastSeen(sessionId: string, lastSeenAt: Date | null) {
  const stale =
    !lastSeenAt || Date.now() - lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS;
  if (!stale) return;
  // fire-and-forget - page auth path shouldn't wait on lastSeen write
  void prisma.session
    .update({
      where: { id: sessionId },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});
}

export async function getSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status !== UserStatus.ACTIVE) return null;

  touchLastSeen(session.id, session.lastSeenAt);
  return toSessionUser(session.user);
}

/** Current DB session id for "this device" badge / revoke checks. */
export async function getCurrentSessionId(): Promise<string | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.id;
}

export async function listUserSessions(userId: string) {
  const now = new Date();
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userAgent: true,
      ip: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
    },
  });
}

/** Revoke a session owned by userId. Returns whether it was the current cookie session. */
export async function revokeUserSession(
  userId: string,
  sessionId: string,
  currentToken: string | null,
) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) return { ok: false as const, wasCurrent: false };

  const wasCurrent =
    !!currentToken && session.tokenHash === hashToken(currentToken);

  await prisma.session.delete({ where: { id: session.id } });
  return { ok: true as const, wasCurrent };
}

/** End every session for this user (including current device). */
export async function revokeAllUserSessions(userId: string) {
  const result = await prisma.session.deleteMany({ where: { userId } });
  return { count: result.count };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function canListUsers(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.STAFF;
}

export function canCreateStaffOrAdmin(role: Role) {
  return role === Role.SUPER_ADMIN;
}

/** Super Admin manages any user; Staff may only edit own profile. */
export function canManageUsersAdmin(role: Role) {
  return role === Role.SUPER_ADMIN;
}

export function canEditUser(
  actor: SessionUser,
  targetUserId: string,
): boolean {
  if (actor.role === Role.SUPER_ADMIN) return true;
  return actor.role === Role.STAFF && actor.id === targetUserId;
}

export function canDeleteUser(
  actor: SessionUser,
  targetUserId: string,
): boolean {
  return actor.role === Role.SUPER_ADMIN && actor.id !== targetUserId;
}

/** Dashboard + full EA control (Super Admin only). */
export function canAccessTerminals(role: Role) {
  return role === Role.SUPER_ADMIN;
}

/** List Account EA (Staff view-only). */
export function canViewAccounts(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.STAFF;
}

/** Only Super Admin provisions terminals for members. */
export function canCreateTerminal(role: Role) {
  return role === Role.SUPER_ADMIN;
}

/** Only Super Admin sets licence expiry. */
export function canSetTerminalExpiry(role: Role) {
  return role === Role.SUPER_ADMIN;
}

export function canExecuteCommands(role: Role) {
  return role === Role.SUPER_ADMIN;
}

export function isAdminRole(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.STAFF;
}

export function homePathForRole(role: Role) {
  if (role === Role.STAFF) return "/admin/users";
  return "/admin";
}

/** Terminal list scope: Super Admin + Staff see all; others match nothing. */
export function terminalOwnerFilter(user: SessionUser) {
  if (canViewAccounts(user.role)) return {};
  // Impossible id - never leak rows if a non-viewer calls list by mistake.
  return { id: "__none__" };
}

export async function getTerminalForUser(
  user: SessionUser,
  idOrTerminalId: string,
) {
  if (!canViewAccounts(user.role)) return null;

  const terminal = await prisma.terminal.findFirst({
    where: {
      OR: [{ id: idOrTerminalId }, { terminalId: idOrTerminalId }],
    },
    include: {
      // no rawJson - avoid shipping heartbeat dump to admin UI/API by default
      snapshot: {
        select: {
          status: true,
          account: true,
          symbol: true,
          balance: true,
          equity: true,
          positions: true,
          buy: true,
          sell: true,
          floatPnl: true,
          dailyPnl: true,
          layer: true,
          multiplier: true,
          target: true,
          cutloss: true,
          mode: true,
          entryMode: true,
          maxLot: true,
          maxLayer: true,
          tradeTime: true,
          tradeStartMin: true,
          tradeEndMin: true,
          updatedAt: true,
        },
      },
      owner: {
        select: { id: true, email: true, displayName: true, role: true },
      },
      memberOwner: {
        select: { id: true, email: true, name: true },
      },
    },
  });
  return terminal;
}
