import type { Request, Response, NextFunction } from "express";
import { registerSchema } from "./auth.schema.js";
import { registerUser, getCurrentUser } from "./auth.service.js";
import { setAccessTokenCookie, setRefreshTokenCookie } from "./cookie.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);

    const result = await registerUser({
      ...body,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.rawRefreshToken, result.rememberMe);

    res.status(201).json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getCurrentUser(req.userId!);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
