import { z } from "zod/v4";
import { entityIdField, limitField } from "../../lib/validation.js";

export const createCommentSchema = z.strictObject({
  content: z
    .string()
    .trim()
    .min(1, "Content must not be empty.")
    .max(5000, "Content must be at most 5000 characters.")
    .optional(),
  mediaKey: z.string().trim().min(1).max(512).optional(),
  parentCommentId: entityIdField.optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentIdParamsSchema = z.strictObject({
  id: entityIdField,
});

export const commentListQuerySchema = z.strictObject({
  cursor: z.string().min(1).optional(),
  limit: limitField(10, 50),
});

export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
