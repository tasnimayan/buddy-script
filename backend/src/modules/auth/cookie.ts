import type { Response, CookieOptions } from "express";
import { env } from "../../config/env.js";

const IS_PROD = env.NODE_ENV === "production";

const BASE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "lax",
};

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie("access_token", token, {
    ...BASE_OPTIONS,
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
}

export function setRefreshTokenCookie(
  res: Response,
  token: string,
  rememberMe: boolean,
): void {
  const ttlDays = rememberMe ? 30 : env.REFRESH_TOKEN_TTL_DAYS;
  res.cookie("refresh_token", token, {
    ...BASE_OPTIONS,
    path: "/api/v1/auth/refresh",
    maxAge: ttlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", { ...BASE_OPTIONS, path: "/" });
  res.clearCookie("refresh_token", {
    ...BASE_OPTIONS,
    path: "/api/v1/auth/refresh",
  });
}
