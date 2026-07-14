import { Prisma } from "@prisma/client";
import { prisma } from "../../db/index.js";
import { AppError } from "../../middleware/error-handler.js";
import { encodeCursor, decodeUuidCursor } from "../../lib/cursor.js";
import { postVisibleWhere } from "../posts/visibility.js";
import { toLikerDto, type LikerDto } from "./dto.js";

const POST_NOT_FOUND = () => new AppError(404, "Post not found.");
const COMMENT_NOT_FOUND = () => new AppError(404, "Comment not found.");

export async function likePost(
  viewerId: string,
  postId: bigint,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const post = await tx.post.findFirst({
      where: { id: postId, ...postVisibleWhere(viewerId) },
      select: { id: true },
    });
    if (!post) throw POST_NOT_FOUND();

    const created = await tx.postLike.createMany({
      data: [{ postId, userId: viewerId }],
      skipDuplicates: true,
    });
    if (created.count === 1) {
      await tx.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
    }
  });
}

export async function unlikePost(
  viewerId: string,
  postId: bigint,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const post = await tx.post.findFirst({
      where: { id: postId, ...postVisibleWhere(viewerId) },
      select: { id: true },
    });
    if (!post) throw POST_NOT_FOUND();

    const deleted = await tx.postLike.deleteMany({
      where: { postId, userId: viewerId },
    });
    if (deleted.count === 1) {
      // Floor guard: never below zero.
      await tx.post.updateMany({
        where: { id: postId, likeCount: { gt: 0 } },
        data: { likeCount: { decrement: 1 } },
      });
    }
  });
}

/** Comment guard: comment is live AND its parent post is visible. */
async function findLikeableComment(
  tx: Prisma.TransactionClient,
  viewerId: string,
  commentId: bigint,
): Promise<void> {
  const comment = await tx.comment.findFirst({
    where: { id: commentId, deletedAt: null, post: postVisibleWhere(viewerId) },
    select: { id: true },
  });
  if (!comment) throw COMMENT_NOT_FOUND();
}

export async function likeComment(
  viewerId: string,
  commentId: bigint,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await findLikeableComment(tx, viewerId, commentId);

    const created = await tx.commentLike.createMany({
      data: [{ commentId, userId: viewerId }],
      skipDuplicates: true,
    });
    if (created.count === 1) {
      await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
      });
    }
  });
}

export async function unlikeComment(
  viewerId: string,
  commentId: bigint,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await findLikeableComment(tx, viewerId, commentId);

    const deleted = await tx.commentLike.deleteMany({
      where: { commentId, userId: viewerId },
    });
    if (deleted.count === 1) {
      await tx.comment.updateMany({
        where: { id: commentId, likeCount: { gt: 0 } },
        data: { likeCount: { decrement: 1 } },
      });
    }
  });
}

interface LikerRow {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_media_key: string | null;
  created_at: Date;
  created_at_str: string;
}

export interface LikersPage {
  items: LikerDto[];
  nextCursor: string | null;
}

// keyset pagination for likers (both posts and comments)

async function fetchLikersPage(
  table: "post_likes" | "comment_likes",
  subjectColumn: "post_id" | "comment_id",
  subjectId: bigint,
  cursor: string | undefined,
  limit: number,
): Promise<LikersPage> {
  const tableSql = Prisma.raw(table);
  const subjectSql = Prisma.raw(subjectColumn);

  const cursorCondition = cursor
    ? (() => {
        const { t, id } = decodeUuidCursor(cursor);
        return Prisma.sql`AND (l.created_at < ${t}::timestamptz
          OR (l.created_at = ${t}::timestamptz AND l.user_id > ${id}::uuid))`;
      })()
    : Prisma.empty;

  const rows = await prisma.$queryRaw<LikerRow[]>`
    SELECT l.user_id, l.created_at, l.created_at::text AS created_at_str,
           pr.first_name, pr.last_name, pr.avatar_media_key
    FROM ${tableSql} l
    JOIN profiles pr ON pr.user_id = l.user_id
    WHERE l.${subjectSql} = ${subjectId}
      ${cursorCondition}
    ORDER BY l.created_at DESC, l.user_id ASC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];

  return {
    items: page.map((row) =>
      toLikerDto(
        {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          avatarMediaKey: row.avatar_media_key,
        },
        row.created_at,
      ),
    ),
    nextCursor:
      hasMore && last
        ? encodeCursor({ t: last.created_at_str, id: last.user_id })
        : null,
  };
}

export async function listPostLikers(
  viewerId: string,
  postId: bigint,
  cursor: string | undefined,
  limit: number,
): Promise<LikersPage> {
  const post = await prisma.post.findFirst({
    where: { id: postId, ...postVisibleWhere(viewerId) },
    select: { id: true },
  });
  if (!post) throw POST_NOT_FOUND();

  return fetchLikersPage("post_likes", "post_id", postId, cursor, limit);
}

export async function listCommentLikers(
  viewerId: string,
  commentId: bigint,
  cursor: string | undefined,
  limit: number,
): Promise<LikersPage> {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null, post: postVisibleWhere(viewerId) },
    select: { id: true },
  });
  if (!comment) throw COMMENT_NOT_FOUND();

  return fetchLikersPage(
    "comment_likes",
    "comment_id",
    commentId,
    cursor,
    limit,
  );
}
