import type { z } from "zod";

import type {
  commentDtoSchema,
  composePostSchema,
  feedPageSchema,
  likerSchema,
  postDtoSchema,
} from "./schemas";

export type ComposePostValues = z.infer<typeof composePostSchema>;
export type PostDto = z.infer<typeof postDtoSchema>;
export type CommentDto = z.infer<typeof commentDtoSchema>;
export type LikerDto = z.infer<typeof likerSchema>;
export type FeedPage = z.infer<typeof feedPageSchema>;

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

export type PostVisibility = "public" | "private";

export interface CreatePostBody {
  content?: string;
  visibility: PostVisibility;
  mediaKeys?: string[];
}

export type CreatePostActionResult =
  | { ok: true; post: PostDto }
  | { ok: false; error: string };
