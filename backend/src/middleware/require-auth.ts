import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

declare module "express" {
  interface Request {
    userId?: string;
    sessionId?: string;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.access_token as string | undefined;

  if (!token) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  try {
    const payload = await verifyAccessToken(token);
    req.userId = payload.sub;
    req.sessionId = payload.sid;
    next();
  } catch {
    res.status(401).json({ message: "Authentication required." });
  }
}
