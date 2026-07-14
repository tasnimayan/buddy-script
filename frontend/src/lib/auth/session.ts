import "server-only";

import { cache } from "react";

import {
  clearAuthCookies,
  getSessionCookieHeader,
  persistBackendCookies,
} from "./cookies";
import { requestLogout, requestMe, requestRefresh } from "./api";
import type { AuthResponse } from "./types";

export type SessionResult = {
  user: AuthResponse["user"] | null;
  /** True when /me failed and refresh succeeded — cookies need an Action sync. */
  needsCookieSync: boolean;
};

export async function refreshAccessToken() {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader?.includes("refresh_token=")) {
    return { ok: false as const, error: "No refresh token." };
  }

  const result = await requestRefresh(cookieHeader);
  if (result.ok && result.setCookies) {
    await persistBackendCookies(result.setCookies);
  }
  return result;
}

/**
 * Resolve the session for RSC. Prefer /me; on failure try refresh for user data
 * without writing cookies (not allowed in Server Components). When
 * `needsCookieSync` is true, the client should call `refreshSessionAction`.
 */
export const resolveSession = cache(async (): Promise<SessionResult> => {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) return { user: null, needsCookieSync: false };

  const me = await requestMe(cookieHeader);
  if (me.ok) {
    return { user: me.data.user ?? null, needsCookieSync: false };
  }

  if (!cookieHeader.includes("refresh_token=")) {
    return { user: null, needsCookieSync: false };
  }

  const refreshed = await requestRefresh(cookieHeader);
  if (!refreshed.ok) return { user: null, needsCookieSync: false };

  return {
    user: refreshed.data.user ?? null,
    needsCookieSync: true,
  };
});

export const getCurrentUser = cache(
  async (): Promise<AuthResponse["user"] | null> => {
    const session = await resolveSession();
    return session.user;
  },
);

/** Best-effort backend logout, then always clear local auth cookies. */
export async function logoutSession(): Promise<void> {
  let cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    await clearAuthCookies();
    return;
  }

  let result = await requestLogout(cookieHeader);

  if (!result.ok) {
    const refreshed = await refreshAccessToken();
    if (refreshed.ok) {
      cookieHeader = await getSessionCookieHeader();
      if (cookieHeader) result = await requestLogout(cookieHeader);
    }
  }

  if (result.ok && result.setCookies) {
    await persistBackendCookies(result.setCookies);
  }

  await clearAuthCookies();
}
