import { Prisma } from "@prisma/client";
import { prisma } from "../../db/index.js";
import { CacheService } from "../../cache/index.js";
import { encodeCursor, decodeBigIntCursor } from "../../lib/cursor.js";
import { postVisibleSql } from "../posts/visibility.js";
import { fetchAuthorMap, fallbackAuthor } from "../users/author.service.js";
import { toPostDto } from "../posts/dto.js";
import type { PostDto } from "../posts/types.js";
import { toCommentDto } from "../comments/dto.js";
import { CommentDto } from "../comments/types.js";
import { FEED_FIRSTPAGE_KEY, FEED_FIRSTPAGE_TTL_SECONDS } from "./cache.js";
import { FEED_DEFAULT_LIMIT } from "./feed.schema.js";

/**
 * All posts, newest-first, all public posts plus the viewer's own private posts, keyset-paginated
 */

interface PostRow {
  id: bigint;
  author_id: string;
  content: string | null;
  visibility: "public" | "private";
  media_count: number;
  like_count: bigint;
  comment_count: bigint;
  created_at: Date;
  created_at_str: string;
}

/**
 * Core query. Raw SQL because Prisma cannot express the tuple keyset
 * comparison; parameters only — never string interpolation. Fetches
 * limit + 1 rows to compute hasMore without a COUNT.
 */
async function fetchFeedRows(
  viewerId: string,
  cursor: string | undefined,
  limitPlusOne: number,
): Promise<PostRow[]> {
  const cursorCondition = cursor
    ? (() => {
        const { t, id } = decodeBigIntCursor(cursor);
        return Prisma.sql`AND (p.created_at, p.id) < (${t}::timestamptz, ${id})`;
      })()
    : Prisma.empty;

  return prisma.$queryRaw<PostRow[]>`
    SELECT p.id, p.author_id, p.content, p.visibility, p.media_count,
           p.like_count, p.comment_count, p.created_at,
           p.created_at::text AS created_at_str
    FROM posts p
    WHERE ${postVisibleSql(viewerId)}
      ${cursorCondition}
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ${limitPlusOne}
  `;
}

/**
 * Row fetch for the cached-ID path.
 * the cached list is global, so another viewer's private posts (cached from
 * their own request) are filtered here, and deletions inside the 10s TTL
 * can never leak. Trade-off (accepted, self-healing within the TTL): a page
 * served from a list warmed by another viewer may run slightly short and
 * may omit this viewer's own older private posts.
 */
async function fetchFeedRowsByIds(
  viewerId: string,
  ids: bigint[],
): Promise<PostRow[]> {
  if (ids.length === 0) return [];
  return prisma.$queryRaw<PostRow[]>`
    SELECT p.id, p.author_id, p.content, p.visibility, p.media_count,
           p.like_count, p.comment_count, p.created_at,
           p.created_at::text AS created_at_str
    FROM posts p
    WHERE p.id IN (${Prisma.join(ids)})
      AND ${postVisibleSql(viewerId)}
    ORDER BY p.created_at DESC, p.id DESC
  `;
}

interface CommentPreviewRow {
  id: bigint;
  post_id: bigint;
  author_id: string;
  parent_comment_id: bigint | null;
  content: string | null;
  media_key: string | null;
  like_count: bigint;
  reply_count: bigint;
  created_at: Date;
}

// Comment preview: the 2 oldest top-level comments for every post on the page in ONE query
async function fetchCommentPreviews(
  postIds: bigint[],
): Promise<CommentPreviewRow[]> {
  if (postIds.length === 0) return [];
  return prisma.$queryRaw<CommentPreviewRow[]>`
    SELECT c.id, c.post_id, c.author_id, c.parent_comment_id, c.content,
           c.media_key, c.like_count, c.reply_count, c.created_at
    FROM unnest(ARRAY[${Prisma.join(postIds)}]::bigint[]) AS pid(post_id)
    JOIN LATERAL (
      SELECT id, post_id, author_id, parent_comment_id, content, media_key,
             like_count, reply_count, created_at
      FROM comments
      WHERE post_id = pid.post_id
        AND parent_comment_id IS NULL
        AND deleted_at IS NULL
      ORDER BY created_at ASC, id ASC
      LIMIT 2
    ) c ON true
  `;
}

export interface FeedPage {
  items: PostDto[];
  nextCursor: string | null;
}

/** Batch hydration: previews, authors, media, and both like-states. */
async function hydrateFeedPage(
  rows: PostRow[],
  viewerId: string,
): Promise<PostDto[]> {
  if (rows.length === 0) return [];

  const postIds = rows.map((r) => r.id);

  const previewRows = await fetchCommentPreviews(postIds);
  const previewIds = previewRows.map((c) => c.id);

  const [authors, media, postLikes, commentLikes] = await Promise.all([
    fetchAuthorMap([
      ...rows.map((r) => r.author_id),
      ...previewRows.map((c) => c.author_id),
    ]),
    prisma.media.findMany({
      where: { postId: { in: postIds } },
      orderBy: [{ postId: "asc" }, { position: "asc" }],
      select: {
        postId: true,
        storageKey: true,
        mediaType: true,
        position: true,
      },
    }),
    prisma.postLike.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    }),
    previewIds.length > 0
      ? prisma.commentLike.findMany({
          where: { userId: viewerId, commentId: { in: previewIds } },
          select: { commentId: true },
        })
      : Promise.resolve([]),
  ]);

  const mediaByPost = new Map<string, typeof media>();
  for (const m of media) {
    const key = m.postId.toString();
    const bucket = mediaByPost.get(key);
    if (bucket) bucket.push(m);
    else mediaByPost.set(key, [m]);
  }

  const likedPostIds = new Set(postLikes.map((l) => l.postId.toString()));
  const likedCommentIds = new Set(
    commentLikes.map((l) => l.commentId.toString()),
  );

  const previewsByPost = new Map<string, CommentDto[]>();
  for (const c of previewRows) {
    const dto = toCommentDto(
      {
        id: c.id,
        postId: c.post_id,
        parentCommentId: c.parent_comment_id,
        content: c.content,
        mediaKey: c.media_key,
        createdAt: c.created_at,
        likeCount: c.like_count,
        replyCount: c.reply_count,
      },
      authors.get(c.author_id) ?? fallbackAuthor(c.author_id),
      likedCommentIds.has(c.id.toString()),
    );
    const key = c.post_id.toString();
    const bucket = previewsByPost.get(key);
    if (bucket) bucket.push(dto);
    else previewsByPost.set(key, [dto]);
  }

  return rows.map((row) => {
    const key = row.id.toString();
    return toPostDto(
      {
        id: row.id,
        content: row.content,
        visibility: row.visibility,
        createdAt: row.created_at,
        likeCount: row.like_count,
        commentCount: row.comment_count,
      },
      authors.get(row.author_id) ?? fallbackAuthor(row.author_id),
      mediaByPost.get(key) ?? [],
      likedPostIds.has(key),
      previewsByPost.get(key) ?? [],
    );
  });
}

export async function getFeed(
  viewerId: string,
  cursor: string | undefined,
  limit: number,
): Promise<FeedPage> {
  let rows: PostRow[];

  // First-page cache applies to the canonical cursorless request only.
  const cacheable = !cursor && limit === FEED_DEFAULT_LIMIT;

  if (cacheable) {
    const cachedIds = await CacheService.get<string[]>(FEED_FIRSTPAGE_KEY);
    if (cachedIds && cachedIds.every((id) => /^\d+$/.test(id))) {
      rows = await fetchFeedRowsByIds(viewerId, cachedIds.map(BigInt));
    } else {
      rows = await fetchFeedRows(viewerId, cursor, limit + 1);

      await CacheService.set(
        FEED_FIRSTPAGE_KEY,
        rows.map((r) => r.id.toString()),
        FEED_FIRSTPAGE_TTL_SECONDS,
      );
    }
  } else {
    rows = await fetchFeedRows(viewerId, cursor, limit + 1);
  }

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];

  const items = await hydrateFeedPage(page, viewerId);

  return {
    items,
    nextCursor:
      hasMore && last
        ? encodeCursor({ t: last.created_at_str, id: last.id.toString() })
        : null,
  };
}
