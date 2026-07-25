import { cookies } from "next/headers";
import { MemberStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  MEMBER_SESSION_COOKIE,
  generateSessionToken,
  hashPassword,
  hashToken,
  sessionExpiryDate,
  verifyPassword,
  type SessionMember,
} from "@/lib/crypto";
import { AuthError } from "@/lib/auth";

const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export type CreateMemberSessionMeta = {
  userAgent?: string | null;
  ip?: string | null;
};

function isBcryptHash(value: string) {
  return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
}

/** Verify member password; rehash legacy plaintext on success. */
export async function verifyMemberPassword(
  memberId: string,
  password: string,
  stored: string,
) {
  if (isBcryptHash(stored)) {
    return verifyPassword(password, stored);
  }
  if (password !== stored) return false;
  const passwordHash = await hashPassword(password);
  await prisma.member
    .update({ where: { id: memberId }, data: { password: passwordHash } })
    .catch(() => {});
  return true;
}

export async function createMemberSession(
  memberId: string,
  meta: CreateMemberSessionMeta = {},
) {
  const token = generateSessionToken();
  const expiresAt = sessionExpiryDate();
  const now = new Date();
  await prisma.memberSession.create({
    data: {
      memberId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
      lastSeenAt: now,
    },
  });
  return { token, expiresAt };
}

export async function destroyMemberSession(token: string) {
  await prisma.memberSession.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}

function touchMemberLastSeen(sessionId: string, lastSeenAt: Date | null) {
  const stale =
    !lastSeenAt || Date.now() - lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS;
  if (!stale) return;
  void prisma.memberSession
    .update({
      where: { id: sessionId },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});
}

export async function getMemberSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(MEMBER_SESSION_COOKIE)?.value ?? null;
}

export async function getSessionMember(): Promise<SessionMember | null> {
  const token = await getMemberSessionToken();
  if (!token) return null;

  const session = await prisma.memberSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { member: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.memberSession
      .delete({ where: { id: session.id } })
      .catch(() => {});
    return null;
  }
  if (session.member.status !== MemberStatus.ACTIVE) return null;

  touchMemberLastSeen(session.id, session.lastSeenAt);
  return {
    id: session.member.id,
    email: session.member.email,
    name: session.member.name,
  };
}

export async function getCurrentMemberSessionId(): Promise<string | null> {
  const token = await getMemberSessionToken();
  if (!token) return null;
  const session = await prisma.memberSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.id;
}

export async function listMemberSessions(memberId: string) {
  const now = new Date();
  return prisma.memberSession.findMany({
    where: { memberId, expiresAt: { gt: now } },
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

export async function revokeMemberSession(
  memberId: string,
  sessionId: string,
  currentToken: string | null,
) {
  const session = await prisma.memberSession.findFirst({
    where: { id: sessionId, memberId },
  });
  if (!session) return { ok: false as const, wasCurrent: false };

  const wasCurrent =
    !!currentToken && session.tokenHash === hashToken(currentToken);

  await prisma.memberSession.delete({ where: { id: session.id } });
  return { ok: true as const, wasCurrent };
}

export async function revokeAllMemberSessions(memberId: string) {
  const result = await prisma.memberSession.deleteMany({ where: { memberId } });
  return { count: result.count };
}

export async function requireMember(): Promise<SessionMember> {
  const member = await getSessionMember();
  if (!member) throw new AuthError("Unauthorized", 401);
  return member;
}

export async function getTerminalForMember(
  member: SessionMember,
  idOrTerminalId: string,
) {
  return prisma.terminal.findFirst({
    where: {
      ownerMemberId: member.id,
      OR: [{ id: idOrTerminalId }, { terminalId: idOrTerminalId }],
    },
    include: {
      snapshot: true,
      memberOwner: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}
