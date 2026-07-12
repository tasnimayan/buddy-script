import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "./error-handler.js";

declare module "express" {
  interface Request {
    userId?: string;
    sessionId?: string;
  }
}

/**
 * Best-effort identification: verifies the access token if present and
 * attaches userId/sessionId, but never rejects. Used ahead of the global
 * rate limiter so authenticated traffic is keyed by user, not IP.
 */
export async function attachAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.access_token as string | undefined;

  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      req.userId = payload.sub;
      req.sessionId = payload.sid;
    } catch {
      // Invalid/expired token - proceed anonymous
    }
  }

  next();
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.access_token as string | undefined;

  if (!token) {
    next(new AppError(401, "Authentication required."));
    return;
  }

  try {
    const payload = await verifyAccessToken(token);
    req.userId = payload.sub;
    req.sessionId = payload.sid;
    next();
  } catch {
    next(new AppError(401, "Authentication required."));
  }
}
