import { prisma } from "../../db/index.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken } from "../../lib/jwt.js";
import { hashToken } from "../../lib/token.js";
import { audit } from "../../lib/audit.js";
import {
  createSession,
  revokeSession,
  revokeAllForUser,
  findSessionByTokenHash,
  rotateSession,
} from "./session.service.js";
import { toUserSummaryDto, toUserDetailsDto } from "./dto.js";
import { Prisma, UserStatus } from "@prisma/client";
import { AppError } from "../../middleware/error-handler.js";
import {
  RegisterParams,
  LoginParams,
  AuthResult,
  RequestMeta,
  type UserDetailsDto,
} from "./types.js";

/**
 * Precomputed bcrypt hash (cost 12) of random string to prevent response
 * timing from revealing whether an account exists.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$I678Wvt61gBw3y3MXRRlyOIGu4ghlEIz8zWLoTJyDtnNsBg84DULe";

export async function registerUser(
  params: RegisterParams,
): Promise<AuthResult> {
  const {
    firstName,
    lastName,
    email,
    password,
    rememberMe,
    userAgent,
    ipAddress,
    requestId,
  } = params;

  // Hash password
  const passwordHash = await hashPassword(password);

  let user: { id: string; email: string };
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          profile: {
            create: { firstName, lastName },
          },
        },
        select: { id: true, email: true },
      });
      return created;
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(409, "An account with this email already exists.");
    }
    throw err;
  }

  const { sessionId, rawRefreshToken } = await createSession(
    user.id,
    { userAgent, ipAddress },
    rememberMe,
  );

  const accessToken = await signAccessToken(user.id, sessionId);

  audit("auth.register", { userId: user.id, ipAddress, requestId });

  return {
    user: { id: user.id, email: user.email, firstName, lastName },
    accessToken,
    rawRefreshToken,
    rememberMe,
  };
}

export async function loginUser(
  params: LoginParams,
): Promise<AuthResult | null> {
  const { email, password, rememberMe, userAgent, ipAddress, requestId } =
    params;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      status: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  });

  // Run bcrypt compare (dummy hash when the user is absent).
  const passwordMatches = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches || user.status === "DEACTIVATED") {
    return null;
  }

  // Fresh session on every login
  const { sessionId, rawRefreshToken } = await createSession(
    user.id,
    { userAgent, ipAddress },
    rememberMe,
  );

  const accessToken = await signAccessToken(user.id, sessionId);

  audit("auth.login.success", { userId: user.id, ipAddress, requestId });

  return {
    user: toUserSummaryDto(user),
    accessToken,
    rawRefreshToken,
    rememberMe,
  };
}

const REFRESH_REJECTED = () => new AppError(401, "Authentication required.");

/**
 * Rotation with reuse detection: a presented token whose session row is
 * already revoked means the token was used twice — probable theft — so every
 * session belonging to that user is revoked.
 */
export async function refreshSession(
  rawRefreshToken: string,
  meta: RequestMeta,
): Promise<AuthResult> {
  const tokenHash = hashToken(rawRefreshToken);
  const session = await findSessionByTokenHash(tokenHash);

  if (!session) {
    throw REFRESH_REJECTED();
  }

  if (session.revokedAt) {
    await revokeAllForUser(session.userId);
    audit("auth.refresh.reuse_detected", {
      userId: session.userId,
      sessionId: session.id.toString(),
      ipAddress: meta.ipAddress,
      requestId: meta.requestId,
    });
    throw REFRESH_REJECTED();
  }

  if (session.expiresAt <= new Date()) {
    throw REFRESH_REJECTED();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      status: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  });

  if (!user || user.status === UserStatus.DEACTIVATED) {
    throw REFRESH_REJECTED();
  }

  // Preserve the session's original TTL across rotations
  const originalTtlDays = Math.round(
    (session.expiresAt.getTime() - session.createdAt.getTime()) /
      (24 * 60 * 60 * 1000),
  );
  const rememberMe = originalTtlDays >= 30;

  const { sessionId, rawRefreshToken: newRefreshToken } = await rotateSession(
    session.id,
    user.id,
    { userAgent: meta.userAgent, ipAddress: meta.ipAddress },
    rememberMe,
  );

  const accessToken = await signAccessToken(user.id, sessionId);

  audit("auth.refresh", {
    userId: user.id,
    sessionId: sessionId.toString(),
    ipAddress: meta.ipAddress,
    requestId: meta.requestId,
  });

  return {
    user: toUserSummaryDto(user),
    accessToken,
    rawRefreshToken: newRefreshToken,
    rememberMe,
  };
}

export async function logoutUser(
  userId: string,
  sessionId: bigint,
  meta: RequestMeta,
): Promise<void> {
  await revokeSession(sessionId);
  audit("auth.logout", {
    userId,
    sessionId: sessionId.toString(),
    ipAddress: meta.ipAddress,
    requestId: meta.requestId,
  });
}

export async function getCurrentUser(userId: string): Promise<UserDetailsDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarMediaKey: true,
          bio: true,
          dob: true,
          gender: true,
          location: true,
        },
      },
    },
  });

  if (!user || user.status === UserStatus.DEACTIVATED) {
    throw new AppError(401, "Authentication required.");
  }

  return toUserDetailsDto(user);
}
