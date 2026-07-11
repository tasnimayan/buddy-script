import type { z } from "zod";

import type { ApiResult } from "../api";
import type {
  authResponseSchema,
  loginSchema,
  registerSchema,
} from "./schemas";

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuthApiResult = ApiResult<AuthResponse>;

export type AuthFieldErrors = Record<string, string[] | undefined>;

export type AuthFormState = {
  errors?: AuthFieldErrors;
  message?: string;
};
