import { v4 as uuidv4 } from "uuid";
import {
  signUpload,
  fetchImageResource,
  type UploadSignature,
} from "../../lib/cloudinary.js";
import { AppError } from "../../middleware/error-handler.js";
import { logger } from "../../lib/logger.js";

export type UploadScope = "posts" | "comments";

/**
 * The user ID is embedded in the signed folder, so the client cannot
 * redirect the upload into another user's namespace.
 */
export function createUploadSignatures(
  userId: string,
  count: number,
  scope: UploadScope,
): UploadSignature[] {
  const folder = `${scope}/${userId}`;
  return Array.from({ length: count }, () => signUpload(folder, uuidv4()));
}

export interface VerifiedMedia {
  storageKey: string;
  bytes: number;
  format: string;
}

/**
 * IDOR guard + resource validation for client-submitted Cloudinary public
 * IDs, shared by posts and comments:
 *  1. prefix check — the key must live under "{scope}/{currentUserId}/",
 *     rejecting other users' uploads;
 *  2. Admin API lookup — asset exists, is an image, and is within the size
 *     limit; bytes/format are taken from the API, never the request body.
 */
export async function verifyMediaKeys(
  keys: string[],
  userId: string,
  scope: UploadScope,
): Promise<VerifiedMedia[]> {
  const invalid = () => new AppError(400, "Invalid media key.");

  const prefix = `${scope}/${userId}/`;
  for (const key of keys) {
    if (!key.startsWith(prefix)) throw invalid();
  }

  let resources;
  try {
    resources = await Promise.all(keys.map((key) => fetchImageResource(key)));
  } catch (err) {
    logger.error({ err }, "Cloudinary media verification failed");
    throw new AppError(502, "Media verification is temporarily unavailable.", {
      code: "MEDIA_VERIFICATION_UNAVAILABLE",
    });
  }

  return resources.map((resource, i) => {
    if (!resource) throw invalid();
    return {
      storageKey: keys[i]!,
      bytes: resource.bytes,
      format: resource.format,
    };
  });
}
