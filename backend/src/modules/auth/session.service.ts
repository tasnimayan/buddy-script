import { prisma } from "../../db/index.js";
import { env } from "../../config/env.js";
import { generateRefreshToken, hashToken } from "../../lib/token.js";

interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

interface CreateSessionResult {
  sessionId: bigint;
  rawRefreshToken: string;
}

export async function createSession(
  userId: string,
  meta: SessionMeta,
  rememberMe: boolean,
): Promise<CreateSessionResult> {
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);

  const ttlDays = rememberMe ? 30 : env.REFRESH_TOKEN_TTL_DAYS;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const session = await prisma.authSession.create({
    data: {
      userId,
      sessionTokenHash: tokenHash,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt,
    },
  });

  return { sessionId: session.id, rawRefreshToken };
}

export async function revokeSession(sessionId: bigint): Promise<void> {
  await prisma.authSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllForUser(userId: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function findSessionByTokenHash(tokenHash: string) {
  return prisma.authSession.findUnique({
    where: { sessionTokenHash: tokenHash },
  });
}

export async function rotateSession(
  oldSessionId: bigint,
  userId: string,
  meta: SessionMeta,
  rememberMe: boolean,
): Promise<CreateSessionResult> {
  await revokeSession(oldSessionId);
  return createSession(userId, meta, rememberMe);
}
