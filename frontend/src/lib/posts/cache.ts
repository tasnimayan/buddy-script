import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";

import { keys } from "./query-keys";
import type { CommentDto, Page, PostDto } from "./types";

type FeedData = InfiniteData<Page<PostDto>, string | null>;
type CommentListData = InfiniteData<Page<CommentDto>, string | null>;

export function updatePostInFeed(
  queryClient: QueryClient,
  postId: string,
  updater: (post: PostDto) => PostDto,
): void {
  queryClient.setQueryData<FeedData>(keys.feed, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.id === postId ? updater(item) : item,
        ),
      })),
    };
  });
}

export function prependPostToFeed(
  queryClient: QueryClient,
  post: PostDto,
): void {
  queryClient.setQueryData<FeedData>(keys.feed, (old) => {
    if (!old) {
      return {
        pages: [{ items: [post], nextCursor: null }],
        pageParams: [null],
      };
    }
    const [first, ...rest] = old.pages;
    if (!first) {
      return {
        pages: [{ items: [post], nextCursor: null }],
        pageParams: [null],
      };
    }
    return {
      ...old,
      pages: [{ ...first, items: [post, ...first.items] }, ...rest],
    };
  });
}

export function removePostFromFeed(
  queryClient: QueryClient,
  postId: string,
): void {
  queryClient.setQueryData<FeedData>(keys.feed, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== postId),
      })),
    };
  });
}

export function updateCommentInList(
  queryClient: QueryClient,
  listKey: QueryKey,
  commentId: string,
  updater: (comment: CommentDto) => CommentDto,
): void {
  queryClient.setQueryData<CommentListData>(listKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.id === commentId ? updater(item) : item,
        ),
      })),
    };
  });
}

export function appendCommentToList(
  queryClient: QueryClient,
  listKey: QueryKey,
  comment: CommentDto,
): void {
  queryClient.setQueryData<CommentListData>(listKey, (old) => {
    if (!old || old.pages.length === 0) {
      return {
        pages: [{ items: [comment], nextCursor: null }],
        pageParams: [null],
      };
    }
    const pages = [...old.pages];
    const lastIndex = pages.length - 1;
    const last = pages[lastIndex]!;
    pages[lastIndex] = { ...last, items: [...last.items, comment] };
    return { ...old, pages };
  });
}

export function removeCommentFromList(
  queryClient: QueryClient,
  listKey: QueryKey,
  commentId: string,
): void {
  queryClient.setQueryData<CommentListData>(listKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== commentId),
      })),
    };
  });
}

export function bumpCommentCount(
  queryClient: QueryClient,
  postId: string,
  delta: number,
): void {
  updatePostInFeed(queryClient, postId, (post) => ({
    ...post,
    commentCount: Math.max(0, post.commentCount + delta),
  }));
}

export function bumpReplyCount(
  queryClient: QueryClient,
  postId: string,
  parentCommentId: string,
  delta: number,
): void {
  updateCommentInList(queryClient, keys.comments(postId), parentCommentId, (c) => ({
    ...c,
    replyCount: Math.max(0, c.replyCount + delta),
  }));
}
