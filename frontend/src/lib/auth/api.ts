import { sendRequest } from "../api";
import { authResponseSchema } from "./schemas";
import type { AuthApiResult, LoginInput, RegisterInput } from "./types";

const ENDPOINTS = {
  login: "/api/auth/login",
  register: "/api/auth/register",
} as const;

export function requestLogin(
  credentials: LoginInput,
): Promise<AuthApiResult> {
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

export function requestRegister(
  input: RegisterInput,
): Promise<AuthApiResult> {
  return sendRequest(ENDPOINTS.register, {
    method: "POST",
    responseSchema: authResponseSchema,
    data: {
      email: input.email,
      password: input.password,
    },
  });
}
