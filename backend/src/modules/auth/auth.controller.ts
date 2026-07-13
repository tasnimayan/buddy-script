import type { Request, Response } from "express";
import type { RegisterInput, LoginInput } from "./auth.schema.js";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getCurrentUser,
} from "./auth.service.js";
import { RequestMeta } from "./types.js";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from "./cookie.js";
import {
  assertLoginAllowed,
  recordLoginFailure,
  resetLoginFailures,
} from "../../middleware/rate-limit.js";
import { AppError } from "../../middleware/error-handler.js";
import { audit } from "../../lib/audit.js";
import { ResponseHandler } from "../../lib/response.js";

function requestMeta(req: Request): RequestMeta {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
    requestId: req.id as string | undefined,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as RegisterInput;

  const result = await registerUser({ ...body, ...requestMeta(req) });

  setAccessTokenCookie(res, result.accessToken);
  setRefreshTokenCookie(res, result.rawRefreshToken, result.rememberMe);

  ResponseHandler.success(
    res,
    "User registered successfully",
    { user: result.user },
    201,
  );
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginInput;
  const meta = requestMeta(req);

  // Failure-count limiter: block up front if either counter is exhausted;
  // successful logins are never counted.
  await assertLoginAllowed(req, body.email);

  const result = await loginUser({ ...body, ...requestMeta(req) });

  if (!result) {
    await recordLoginFailure(req, body.email);
    audit("auth.login.failure", {
      email: body.email,
      ipAddress: meta.ipAddress,
      requestId: meta.requestId,
    });

    throw new AppError(401, "Invalid email or password.");
  }

  await resetLoginFailures(body.email);

  setAccessTokenCookie(res, result.accessToken);
  setRefreshTokenCookie(res, result.rawRefreshToken, result.rememberMe);

  ResponseHandler.success(res, "Login successful", { user: result.user }, 200);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = req.cookies?.refresh_token as string | undefined;

  if (!rawRefreshToken) {
    throw new AppError(401, "Authentication required.");
  }

  const result = await refreshSession(rawRefreshToken, requestMeta(req));

  setAccessTokenCookie(res, result.accessToken);
  setRefreshTokenCookie(res, result.rawRefreshToken, result.rememberMe);

  ResponseHandler.success(res, "Session refreshed", { user: result.user }, 200);
}

export async function logout(req: Request, res: Response): Promise<void> {
  // requireAuth guarantees these claims; sid is our own stringified BigInt.
  await logoutUser(req.userId!, BigInt(req.sessionId!), requestMeta(req));

  clearAuthCookies(res);
  ResponseHandler.success(res, "Logged out", null, 204);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await getCurrentUser(req.userId!);
  ResponseHandler.success(res, "User fetched", { user }, 200);
}
