import { z } from "zod";

import { sendRequest } from "@/lib/api";
import { authResponseSchema } from "./schemas";
import type { AuthApiResult, LoginInput, RegisterInput } from "./types";

const ENDPOINTS = {
  login: "/auth/login",
  register: "/auth/register",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
} as const;

export function requestLogin(credentials: LoginInput): Promise<AuthApiResult> {
  return sendRequest(ENDPOINTS.login, {
    method: "POST",
    responseSchema: authResponseSchema,
    data: {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe,
    },
  });
}

export function requestRegister(input: RegisterInput): Promise<AuthApiResult> {
  return sendRequest(ENDPOINTS.register, {
    method: "POST",
    responseSchema: authResponseSchema,
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    },
  });
}

export function requestMe(cookieHeader: string): Promise<AuthApiResult> {
  return sendRequest(ENDPOINTS.me, {
    method: "GET",
    responseSchema: authResponseSchema,
    headers: { Cookie: cookieHeader },
  });
}

export function requestRefresh(cookieHeader: string): Promise<AuthApiResult> {
  return sendRequest(ENDPOINTS.refresh, {
    method: "POST",
    responseSchema: authResponseSchema,
    headers: { Cookie: cookieHeader },
  });
}

export function requestLogout(cookieHeader: string) {
  return sendRequest(ENDPOINTS.logout, {
    method: "POST",
    responseSchema: z.unknown(),
    headers: { Cookie: cookieHeader },
  });
}
