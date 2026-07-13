import { z } from "zod/v4";
import { entityIdField } from "../../lib/validation.js";
import { Visibility } from "@prisma/client";

export const createPostSchema = z.strictObject({
  content: z
    .string()
    .trim()
    .min(1, "Content must not be empty.")
    .max(10000, "Content must be at most 10000 characters.")
    .optional(),
  visibility: z.enum(Object.values(Visibility)).default("public"),
  mediaKeys: z
    .array(z.string().trim().min(1).max(512))
    .max(4, "At most 4 media items per post.")
    .optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const postIdParamsSchema = z.strictObject({
  id: entityIdField,
});
