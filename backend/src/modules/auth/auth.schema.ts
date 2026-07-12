import { z } from "zod/v4";
import { trimmedString, emailField } from "../../lib/validation.js";

export const registerSchema = z.strictObject({
  firstName: trimmedString(1, 100, "First name"),
  lastName: trimmedString(1, 100, "Last name"),
  email: emailField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
  rememberMe: z.boolean().optional().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.strictObject({
  email: emailField,
  password: z.string().min(1, "Password is required.").max(128),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
