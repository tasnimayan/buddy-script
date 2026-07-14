"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  loginSchema,
  registerSchema,
  requestLogin,
  requestRegister,
  type AuthFormState,
} from "@/lib/auth";

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

  redirect("/feed");
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
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

  redirect("/feed");
}
