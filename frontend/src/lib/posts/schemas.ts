import { z } from "zod";

export const MAX_POST_IMAGES = 4;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — mirrors the backend limit.
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const contentField = z
  .string()
  .trim()
  .max(10000, "Content must be at most 10000 characters.");

const imagesField = z
  .array(z.instanceof(File))
  .max(MAX_POST_IMAGES, `You can attach at most ${MAX_POST_IMAGES} images.`)
  .refine(
    (files) => files.every((file) => file.size <= MAX_IMAGE_BYTES),
    "Each image must be 5MB or smaller.",
  )
  .refine(
    (files) =>
      files.every((file) =>
        (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type),
      ),
    "Only JPEG, PNG, WebP, or GIF images are allowed.",
  );

const visibilityField = z.enum(["public", "private"]);

// Shared by the client form (react-hook-form resolver) and the server action,
// so a post always needs either text or at least one image.
export const composePostSchema = z
  .object({
    content: contentField,
    images: imagesField,
    visibility: visibilityField,
  })
  .superRefine((values, ctx) => {
    const hasContent = values.content.length > 0;
    const hasImages = values.images.length > 0;
    if (!hasContent && !hasImages) {
      ctx.addIssue({
        code: "custom",
        message: "Write something or add an image to post.",
        path: ["content"],
      });
    }
  });

export const postAuthorSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
});

const postMediaSchema = z.object({
  url: z.string(),
  type: z.string(),
  position: z.number(),
});

export const postDtoSchema = z.object({
  id: z.string(),
  content: z.string().nullable(),
  visibility: z.string(),
  createdAt: z.string(),
  media: z.array(postMediaSchema),
  author: postAuthorSchema,
  likeCount: z.number(),
  commentCount: z.number(),
  viewerHasLiked: z.boolean(),
  commentPreview: z.array(z.unknown()).optional(),
});

export const commentDtoSchema = z.object({
  id: z.string(),
  content: z.string().nullable(),
  mediaUrl: z.string().nullable().optional(),
  author: postAuthorSchema,
  likeCount: z.number(),
  replyCount: z.number(),
  viewerHasLiked: z.boolean(),
  createdAt: z.string(),
  parentCommentId: z.string().nullable(),
  postId: z.string().optional(),
});

export const likerSchema = z.object({
  user: postAuthorSchema,
  likedAt: z.string(),
});

export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export const feedPageSchema = pageSchema(postDtoSchema);
export const commentsPageSchema = pageSchema(commentDtoSchema);
export const likersPageSchema = pageSchema(likerSchema);

export const voidResponseSchema = z.undefined();

// The backend wraps payloads in a { success, message, data } envelope; unwrap
// to the post so callers receive the DTO directly.
export const createPostResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: postDtoSchema,
  })
  .transform((envelope) => envelope.data);
