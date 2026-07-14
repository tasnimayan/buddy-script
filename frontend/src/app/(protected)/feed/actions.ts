"use server";

import {
  composePostSchema,
  requestCreatePost,
  type CreatePostActionResult,
  type PostVisibility,
} from "@/lib/posts";
import { uploadPostImages } from "@/lib/posts/cloudinary";
import {
  getCurrentUserId,
  getSessionCookieHeader,
} from "@/lib/auth/cookies";

function parseVisibility(value: FormDataEntryValue | null): PostVisibility {
  return value === "private" ? "private" : "public";
}

export async function createPostAction(
  formData: FormData,
): Promise<CreatePostActionResult> {
  const rawContent = formData.get("content");
  const images = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const parsed = composePostSchema.safeParse({
    content: typeof rawContent === "string" ? rawContent : "",
    images,
    visibility: parseVisibility(formData.get("visibility")),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Your post is invalid.",
    };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, error: "You must be signed in to post." };
  }

  let mediaKeys: string[] = [];
  try {
    if (parsed.data.images.length > 0) {
      mediaKeys = await uploadPostImages(parsed.data.images, userId);
    }
  } catch {
    return {
      ok: false,
      error: "We couldn't upload your images. Please try again.",
    };
  }

  const cookieHeader = await getSessionCookieHeader();
  const content = parsed.data.content?.trim() || undefined;

  const result = await requestCreatePost(
    {
      content,
      visibility: parsed.data.visibility,
      ...(mediaKeys.length > 0 ? { mediaKeys } : {}),
    },
    cookieHeader,
  );

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, post: result.data };
}
