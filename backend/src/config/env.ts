import "dotenv/config";
import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z
    .string()
    .min(1)
    .refine(
      (v) => v.startsWith("redis://") || v.startsWith("rediss://"),
      "REDIS_URL must start with redis:// or rediss://",
    ),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(16, "ACCESS_TOKEN_SECRET must be at least 16 characters"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = z.prettifyError(parsed.error);
  console.error("❌ Invalid environment variables:\n", formatted);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);

export type Env = z.infer<typeof envSchema>;
