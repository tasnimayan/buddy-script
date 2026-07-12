import { z } from "zod/v4";

// Shared zod helpers — input hygiene rules applied app-wide:

export function trimmedString(min: number, max: number, label = "Value") {
  return z
    .string()
    .trim()
    .min(
      min,
      `${label} must be at least ${min} character${min === 1 ? "" : "s"}.`,
    )
    .max(max, `${label} must be at most ${max} characters.`);
}

export const emailField = z
  .email("Invalid email address.")
  .transform((v) => v.toLowerCase());

// BigInt entity ID (posts, comments, media, sessions)
export const entityIdField = z
  .string()
  .regex(/^\d+$/, "Invalid id.")
  .transform((v) => BigInt(v));

export const uuidField = z.uuid("Invalid id.");

// Pagination limit: coerced, defaulted, and clamped to `max` server-side.
export function limitField(def: number, max: number) {
  return z.coerce
    .number()
    .int("Limit must be an integer.")
    .min(1, "Limit must be positive.")
    .default(def)
    .transform((v) => Math.min(v, max));
}
