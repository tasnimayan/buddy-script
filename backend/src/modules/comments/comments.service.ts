import { Prisma } from "@prisma/client";
import { prisma } from "../../db/index.js";
import { AppError } from "../../middleware/error-handler.js";
import { encodeCursor, decodeBigIntCursor } from "../../lib/cursor.js";
import { verifyMediaKeys } from "../uploads/uploads.service.js";
import { postVisibleWhere } from "../posts/visibility.js";
import { fetchAuthorMap, fallbackAuthor } from "../users/author.service.js";
import { toCommentDto } from "./dto.js";
import {
  CommentDto,
  CommentInput,
  CommentRow,
  CreateCommentParams,
} from "./types.js";

const POST_NOT_FOUND = () => new AppError(404, "Post not found.");
const COMMENT_NOT_FOUND = () => new AppError(404, "Comment not found.");

export async function createComment(
  params: CreateCommentParams,
): Promise<CommentDto> {
  const { viewerId, postId, content, mediaKey, parentCommentId } = params;

  if (!content && !mediaKey) {
    throw new AppError(400, "A comment needs content or an image.");
  }

  // Same prefix + resource verification as posts, folder comments/{userId}.
  if (mediaKey) {
    await verifyMediaKeys([mediaKey], viewerId, "comments");
  }

  const comment = await prisma.$transaction(async (tx) => {
    const post = await tx.post.findFirst({
      where: { id: postId, ...postVisibleWhere(viewerId) },
      select: { id: true },
    });
    if (!post) throw POST_NOT_FOUND();

    if (parentCommentId !== undefined) {
      const parent = await tx.comment.findFirst({
        where: { id: parentCommentId, deletedAt: null },
        select: { id: true, postId: true, parentCommentId: true },
      });
      // Hierarchy is exactly one level deep
      if (!parent || parent.postId !== postId) {
        throw COMMENT_NOT_FOUND();
      }
      if (parent.parentCommentId !== null) {
        throw new AppError(400, "You can only reply to top-level comments.");
      }
      await tx.comment.update({
        where: { id: parentCommentId },
        data: { replyCount: { increment: 1 } },
      });
    }

    const created = await tx.comment.create({
      data: {
        postId,
        authorId: viewerId,
        parentCommentId: parentCommentId ?? null,
        content: content ?? null,
        mediaKey: mediaKey ?? null,
      },
    });

    await tx.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return created;
  });

  const authors = await fetchAuthorMap([viewerId]);
  return toCommentDto(
    comment,
    authors.get(viewerId) ?? fallbackAuthor(viewerId),
    false,
  );
}

function rowToInput(row: CommentRow): CommentInput {
  return {
    id: row.id,
    postId: row.post_id,
    parentCommentId: row.parent_comment_id,
    content: row.content,
    mediaKey: row.media_key,
    createdAt: row.created_at,
    likeCount: row.like_count,
    replyCount: row.reply_count,
  };
}

export interface CommentPage {
  items: CommentDto[];
  nextCursor: string | null;
}

// Keyset pagination (created_at ASC, id ASC. Threads read oldest-first)

async function fetchCommentRows(
  scopeCondition: Prisma.Sql,
  cursor: string | undefined,
  limit: number,
): Promise<CommentRow[]> {
  const cursorCondition = cursor
    ? (() => {
        const { t, id } = decodeBigIntCursor(cursor);
        return Prisma.sql`AND (c.created_at, c.id) > (${t}::timestamptz, ${id})`;
      })()
    : Prisma.empty;

  return prisma.$queryRaw<CommentRow[]>`
    SELECT c.id, c.post_id, c.author_id, c.parent_comment_id, c.content,
           c.media_key, c.like_count, c.reply_count, c.created_at,
           c.created_at::text AS created_at_str
    FROM comments c
    WHERE ${scopeCondition}
      AND c.deleted_at IS NULL
      ${cursorCondition}
    ORDER BY c.created_at ASC, c.id ASC
    LIMIT ${limit + 1}
  `;
}

async function hydrateCommentPage(
  rows: CommentRow[],
  viewerId: string,
  limit: number,
): Promise<CommentPage> {
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);

  const [authors, viewerLikes] = await Promise.all([
    fetchAuthorMap(page.map((r) => r.author_id)),
    page.length > 0
      ? prisma.commentLike.findMany({
          where: { userId: viewerId, commentId: { in: page.map((r) => r.id) } },
          select: { commentId: true },
        })
      : Promise.resolve([]),
  ]);
  const likedIds = new Set(viewerLikes.map((l) => l.commentId.toString()));

  const last = page[page.length - 1];
  return {
    items: page.map((row) =>
      toCommentDto(
        rowToInput(row),
        authors.get(row.author_id) ?? fallbackAuthor(row.author_id),
        likedIds.has(row.id.toString()),
      ),
    ),
    nextCursor:
      hasMore && last
        ? encodeCursor({ t: last.created_at_str, id: last.id.toString() })
        : null,
  };
}

export async function listTopLevelComments(
  viewerId: string,
  postId: bigint,
  cursor: string | undefined,
  limit: number,
): Promise<CommentPage> {
  const post = await prisma.post.findFirst({
    where: { id: postId, ...postVisibleWhere(viewerId) },
    select: { id: true },
  });
  if (!post) throw POST_NOT_FOUND();

  const rows = await fetchCommentRows(
    Prisma.sql`c.post_id = ${postId} AND c.parent_comment_id IS NULL`,
    cursor,
    limit,
  );
  return hydrateCommentPage(rows, viewerId, limit);
}

export async function listReplies(
  viewerId: string,
  commentId: bigint,
  cursor: string | undefined,
  limit: number,
): Promise<CommentPage> {
  const parent = await prisma.comment.findFirst({
    where: {
      id: commentId,
      deletedAt: null,
      post: postVisibleWhere(viewerId),
    },
    select: { id: true },
  });
  if (!parent) throw COMMENT_NOT_FOUND();

  const rows = await fetchCommentRows(
    Prisma.sql`c.parent_comment_id = ${commentId}`,
    cursor,
    limit,
  );
  return hydrateCommentPage(rows, viewerId, limit);
}

/**
 * Delete by the comment's author OR the post's author (standard moderation
 * norm: you moderate the threads on your own posts). Soft delete; counters
 * settle in the same transaction: a top-level comment takes its replies out
 * of reach, so the post loses 1 + reply_count; a reply also decrements its
 * parent's reply_count.
 */
export async function deleteComment(
  viewerId: string,
  commentId: bigint,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
        post: postVisibleWhere(viewerId),
      },
      select: {
        id: true,
        authorId: true,
        postId: true,
        parentCommentId: true,
        replyCount: true,
        post: { select: { authorId: true } },
      },
    });
    if (!comment) throw COMMENT_NOT_FOUND();

    if (comment.authorId !== viewerId && comment.post.authorId !== viewerId) {
      throw new AppError(403, "You cannot delete this comment.");
    }

    // Conditional soft delete guards against a concurrent delete: counters
    // move only when this call actually flipped the row.
    const deleted = await tx.comment.updateMany({
      where: { id: commentId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (deleted.count === 0) throw COMMENT_NOT_FOUND();

    const postDecrement =
      comment.parentCommentId === null ? 1n + comment.replyCount : 1n;

    await tx.$executeRaw`
      UPDATE posts
      SET comment_count = GREATEST(comment_count - ${postDecrement}, 0)
      WHERE id = ${comment.postId}
    `;

    if (comment.parentCommentId !== null) {
      await tx.$executeRaw`
        UPDATE comments
        SET reply_count = GREATEST(reply_count - 1, 0)
        WHERE id = ${comment.parentCommentId}
      `;
    }
  });
}
