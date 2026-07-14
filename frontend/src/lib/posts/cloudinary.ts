import "server-only";

import { v2 as cloudinary } from "cloudinary";

/**
 * Server-only wrapper around the Cloudinary SDK. Credentials are read from the
 * `CLOUDINARY_URL` env var (never exposed to the client). Images live under
 * `posts/{userId}` so the backend can verify ownership by public-id prefix.
 */
export async function uploadPostImages(
  files: File[],
  userId: string,
): Promise<string[]> {
  const folder = `posts/${userId}`;

  return Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
      const { public_id } = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "image",
      });
      return public_id;
    }),
  );
}
