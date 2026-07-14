"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { z } from "zod";

import { apiFetch } from "@/lib/api/browser";

import {
  appendCommentToList,
  bumpCommentCount,
  bumpReplyCount,
  removeCommentFromList,
  updateCommentInList,
} from "./cache";
import { keys } from "./query-keys";
import { commentDtoSchema, commentsPageSchema } from "./schemas";
import type { CommentDto, Page } from "./types";

const voidSchema = z.undefined();

export function useComments(postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: keys.comments(postId),
    queryFn: ({ pageParam }) =>
      apiFetch(
        `/api/v1/posts/${postId}/comments?limit=10${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        commentsPageSchema,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
    select: (d) => d.pages.flatMap((p) => p.items),
  });
}

export function useReplies(commentId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: keys.replies(commentId),
    queryFn: ({ pageParam }) =>
      apiFetch(
        `/api/v1/comments/${commentId}/replies?limit=10${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        commentsPageSchema,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
    select: (d) => d.pages.flatMap((p) => p.items),
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      content: string;
      parentCommentId?: string;
    }) =>
      apiFetch(`/api/v1/posts/${postId}/comments`, commentDtoSchema, {
        method: "POST",
        body: JSON.stringify({
          content: input.content,
          ...(input.parentCommentId
            ? { parentCommentId: input.parentCommentId }
            : {}),
        }),
      }),
    onSuccess: (comment, variables) => {
      if (variables.parentCommentId) {
        appendCommentToList(
          queryClient,
          keys.replies(variables.parentCommentId),
          comment,
        );
        bumpReplyCount(queryClient, postId, variables.parentCommentId, 1);
      } else {
        appendCommentToList(queryClient, keys.comments(postId), comment);
      }
      bumpCommentCount(queryClient, postId, 1);
    },
  });
}

export function useCommentLike(listKey: QueryKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      like,
    }: {
      commentId: string;
      like: boolean;
    }) => {
      await apiFetch(`/api/v1/comments/${commentId}/like`, voidSchema, {
        method: like ? "PUT" : "DELETE",
      });
    },
    onMutate: async ({ commentId, like }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const snapshot =
        queryClient.getQueryData<
          InfiniteData<Page<CommentDto>, string | null>
        >(listKey);

      updateCommentInList(queryClient, listKey, commentId, (comment) => {
        if (comment.viewerHasLiked === like) return comment;
        return {
          ...comment,
          viewerHasLiked: like,
          likeCount: Math.max(0, comment.likeCount + (like ? 1 : -1)),
        };
      });

      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(listKey, context.snapshot);
      }
    },
  });
}

export function useDeleteComment(
  postId: string,
  listKey: QueryKey,
  options?: { parentCommentId?: string | null; replyCount?: number },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await apiFetch(`/api/v1/comments/${commentId}`, voidSchema, {
        method: "DELETE",
      });
    },
    onSuccess: (_data, commentId) => {
      removeCommentFromList(queryClient, listKey, commentId);
      const isReply = Boolean(options?.parentCommentId);
      const delta = isReply ? -1 : -(1 + (options?.replyCount ?? 0));
      bumpCommentCount(queryClient, postId, delta);
      if (options?.parentCommentId) {
        bumpReplyCount(queryClient, postId, options.parentCommentId, -1);
      } else {
        queryClient.removeQueries({ queryKey: keys.replies(commentId) });
      }
    },
  });
}
