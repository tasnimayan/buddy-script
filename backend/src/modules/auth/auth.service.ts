import { prisma } from "../../db/index.js";
import { hashPassword } from "../../lib/password.js";
import { signAccessToken } from "../../lib/jwt.js";
import { createSession } from "./session.service.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../middleware/error-handler.js";

interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rememberMe: boolean;
  userAgent?: string;
  ipAddress?: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  accessToken: string;
  rawRefreshToken: string;
  rememberMe: boolean;
}

export async function registerUser(params: RegisterParams): Promise<AuthResult> {
  const { firstName, lastName, email, password, rememberMe, userAgent, ipAddress } = params;

  // Hash password BEFORE the transaction (bcrypt ~100ms, don't hold a connection)
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

  return {
    user: { id: user.id, email: user.email, firstName, lastName },
    accessToken,
    rawRefreshToken,
    rememberMe,
  };
}

export async function getCurrentUser(userId: string) {
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

  if (!user || user.status === "DEACTIVATED") {
    throw new AppError(401, "Authentication required.");
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.profile?.firstName ?? "",
    lastName: user.profile?.lastName ?? "",
    avatarMediaKey: user.profile?.avatarMediaKey ?? null,
    bio: user.profile?.bio ?? null,
    dob: user.profile?.dob ?? null,
    gender: user.profile?.gender ?? null,
    location: user.profile?.location ?? null,
    createdAt: user.createdAt,
  };
}
