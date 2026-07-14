import { sendRequest, type ApiResult } from "../api";
import { createPostResponseSchema } from "./schemas";
import type { CreatePostBody, PostDto } from "./types";

// Base URL already includes `/api/v1`.
const POSTS_ENDPOINT = "/posts";

export function requestCreatePost(
  body: CreatePostBody,
  cookieHeader?: string,
): Promise<ApiResult<PostDto>> {
  return sendRequest(POSTS_ENDPOINT, {
    method: "POST",
    responseSchema: createPostResponseSchema,
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    data: body,
  });
}
