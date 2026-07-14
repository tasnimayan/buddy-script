import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

/**
 * Thin wrapper over the cloudinary SDK. DB stores public IDs (`storage_key`) only.
 * delivery URLs are computed here at DTO time so CDN/transformation changes never require a data migration.
 */

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
}

/**
 * Server dictates both `folder` and `public_id` and both are covered by the
 * signature — the client only supplies the file bytes and cannot redirect
 * the upload to another user's folder.
 */
export function signUpload(folder: string, publicId: string): UploadSignature {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, public_id: publicId },
    env.CLOUDINARY_API_SECRET,
  );
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    publicId,
    signature,
  };
}

export interface ImageResource {
  bytes: number;
  format: string;
}

interface CloudinaryApiError {
  error?: { http_code?: number };
}

/**
 * Existence + metadata check against the Cloudinary Admin API. Returns null
 * when the asset is missing or fails validation (not an image, too large).
 * `bytes`/`format` always come from the API, never from the client.
 */
export async function fetchImageResource(
  publicId: string,
): Promise<ImageResource | null> {
  let res: { resource_type?: string; bytes?: number; format?: string };
  try {
    res = await cloudinary.api.resource(publicId, { resource_type: "image" });
  } catch (err) {
    const httpCode = (err as CloudinaryApiError).error?.http_code;
    if (httpCode === 404) return null;
    throw err;
  }

  if (
    res.resource_type !== "image" ||
    typeof res.bytes !== "number" ||
    res.bytes > MAX_IMAGE_BYTES
  ) {
    return null;
  }

  return { bytes: res.bytes, format: res.format ?? "" };
}

/** CDN delivery URL with on-the-fly resize/format negotiation. */
export function buildImageUrl(storageKey: string, width = 1080): string {
  return cloudinary.url(storageKey, {
    fetch_format: "auto",
    quality: "auto",
    width,
    crop: "limit",
    secure: true,
  });
}

export function buildAvatarUrl(storageKey: string | null): string | null {
  return storageKey ? buildImageUrl(storageKey, 256) : null;
}
