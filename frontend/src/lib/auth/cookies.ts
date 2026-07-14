import "server-only";

import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

type CookieWriteOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: "lax" | "strict" | "none";
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) return null;
  try {
    const json = Buffer.from(payloadSegment, "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseSetCookieHeader(header: string): {
  name: string;
  value: string;
  options: CookieWriteOptions;
} | null {
  const segments = header.split(";").map((part) => part.trim());
  const [nameValue, ...attributes] = segments;
  if (!nameValue) return null;

  const separator = nameValue.indexOf("=");
  if (separator <= 0) return null;

  const name = nameValue.slice(0, separator);
  const value = nameValue.slice(separator + 1);
  const options: CookieWriteOptions = {};

  for (const attribute of attributes) {
    const [rawKey, ...rawValue] = attribute.split("=");
    const key = rawKey?.toLowerCase();
    const attrValue = rawValue.join("=");

    if (key === "httponly") options.httpOnly = true;
    else if (key === "secure") options.secure = true;
    else if (key === "path" && attrValue) options.path = attrValue;
    else if (key === "max-age" && attrValue) {
      const maxAge = Number(attrValue);
      if (!Number.isNaN(maxAge)) options.maxAge = maxAge;
    } else if (key === "expires" && attrValue) {
      const expires = new Date(attrValue);
      if (!Number.isNaN(expires.getTime())) options.expires = expires;
    } else if (key === "samesite" && attrValue) {
      const sameSite = attrValue.toLowerCase();
      if (
        sameSite === "lax" ||
        sameSite === "strict" ||
        sameSite === "none"
      ) {
        options.sameSite = sameSite;
      }
    }
  }

  // Backend scopes refresh to /api/v1/auth/refresh; widen so Next can read it.
  if (name === REFRESH_TOKEN_COOKIE) options.path = "/";

  return { name, value, options };
}

/**
 * Backend Set-Cookie headers only hit the Next.js server (via axios), not the
 * browser. Re-apply them so the session survives redirects / RSC.
 */
export async function persistBackendCookies(
  setCookieHeaders: string[],
): Promise<void> {
  if (setCookieHeaders.length === 0) return;

  const store = await cookies();
  for (const header of setCookieHeaders) {
    const parsed = parseSetCookieHeader(header);
    if (!parsed) continue;
    store.set(parsed.name, parsed.value, parsed.options);
  }
}

/**
 * Reads user id from the access-token cookie (unverified). Used only to seed
 * Cloudinary folder paths — the backend re-checks ownership.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return typeof payload?.sub === "string" ? payload.sub : null;
}

/** Forwards browser cookies on server→backend requests. */
export async function getSessionCookieHeader(): Promise<string | undefined> {
  const all = (await cookies()).getAll();
  if (all.length === 0) return undefined;
  return all.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(REFRESH_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(REFRESH_TOKEN_COOKIE, "", {
    path: "/api/v1/auth/refresh",
    maxAge: 0,
  });
}
