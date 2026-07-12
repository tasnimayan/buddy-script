import { z } from "zod/v4";

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(100, "First name must be at most 100 characters."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(100, "Last name must be at most 100 characters."),
  email: z
    .email("Invalid email address.")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
  rememberMe: z.boolean().optional().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;
