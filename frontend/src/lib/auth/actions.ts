"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { persistBackendCookies } from "./cookies";
import {
  requestLogin,
  requestRegister,
} from "./api";
import { loginSchema, registerSchema } from "./schemas";
import {
  getCurrentUser,
  logoutSession,
  refreshAccessToken,
} from "./session";
import type { AuthFormState, AuthResponse } from "./types";

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await requestLogin(parsed.data);
  if (!result.ok) {
    return { message: result.error };
  }

  if (result.setCookies) {
    await persistBackendCookies(result.setCookies);
  }

  redirect("/feed");
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await requestRegister(parsed.data);
  if (!result.ok) {
    return { message: result.error };
  }

  redirect("/login?registered=1");
}

export async function logoutAction(): Promise<void> {
  await logoutSession();
  redirect("/login");
}

export async function getSessionUserAction(): Promise<
  AuthResponse["user"] | null
> {
  return getCurrentUser();
}

export async function refreshSessionAction(): Promise<
  AuthResponse["user"] | null
> {
  const result = await refreshAccessToken();
  if (!result.ok) return null;
  return result.data.user ?? null;
}
