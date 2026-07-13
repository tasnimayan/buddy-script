import { prisma } from "../../db/index.js";
import { AppError } from "../../middleware/error-handler.js";
import { verifyMediaKeys } from "../uploads/uploads.service.js";
import { invalidateFeedFirstPage } from "../feed/cache.js";
import { postVisibleWhere } from "./visibility.js";
import { toPostDto } from "./dto.js";
import type { CreatePostParams, PostDto } from "./types.js";

export async function createPost(params: CreatePostParams): Promise<PostDto> {
  const { authorId, content, visibility } = params;
  const mediaKeys = params.mediaKeys ?? [];

  if (!content && mediaKeys.length === 0) {
    throw new AppError(400, "A post needs content or at least one image.");
  }

  // Cloudinary verification
  const verifiedMedia = await verifyMediaKeys(mediaKeys, authorId, "posts");

  const author = await prisma.profile.findUnique({
    where: { userId: authorId },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      avatarMediaKey: true,
    },
  });

  if (!author) {
    throw new AppError(401, "Authentication required.");
  }

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        authorId,
        content: content ?? null,
        visibility,
        mediaCount: verifiedMedia.length,
      },
    });

    if (verifiedMedia.length > 0) {
      await tx.media.createMany({
        data: verifiedMedia.map((m, position) => ({
          postId: created.id,
          storageKey: m.storageKey,
          mediaType: "image" as const,
          extension: m.format.slice(0, 10),
          byteSize: BigInt(m.bytes),
          position,
        })),
      });
    }

    return created;
  });

  await invalidateFeedFirstPage();

  return toPostDto(
    post,
    {
      id: author.userId,
      firstName: author.firstName,
      lastName: author.lastName,
      avatarMediaKey: author.avatarMediaKey,
    },
    verifiedMedia.map((m, position) => ({
      storageKey: m.storageKey,
      mediaType: "image",
      position,
    })),
    false,
  );
}

export async function getPost(
  viewerId: string,
  postId: bigint,
): Promise<PostDto> {
  const post = await prisma.post.findFirst({
    where: { id: postId, ...postVisibleWhere(viewerId) },
    include: {
      author: {
        select: {
          id: true,
          profile: {
            select: { firstName: true, lastName: true, avatarMediaKey: true },
          },
        },
      },
      media: {
        orderBy: { position: "asc" },
        select: { storageKey: true, mediaType: true, position: true },
      },
      likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 },
    },
  });

  if (!post) {
    throw new AppError(404, "Post not found.");
  }

  return toPostDto(
    post,
    {
      id: post.author.id,
      firstName: post.author.profile?.firstName ?? "",
      lastName: post.author.profile?.lastName ?? "",
      avatarMediaKey: post.author.profile?.avatarMediaKey ?? null,
    },
    post.media,
    post.likes.length > 0,
  );
}

export async function deletePost(
  viewerId: string,
  postId: bigint,
): Promise<void> {
  const result = await prisma.post.updateMany({
    where: { id: postId, authorId: viewerId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (result.count === 0) {
    throw new AppError(404, "Post not found.");
  }

  await invalidateFeedFirstPage();
}
