"use client";

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { z } from "zod";

import { apiFetch } from "@/lib/api/browser";

import {
  removePostFromFeed,
  updatePostInFeed,
} from "./cache";
import { keys } from "./query-keys";
import type { Page, PostDto } from "./types";

const voidSchema = z.undefined();

export function usePostLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      like,
    }: {
      postId: string;
      like: boolean;
    }) => {
      await apiFetch(`/api/v1/posts/${postId}/like`, voidSchema, {
        method: like ? "PUT" : "DELETE",
      });
    },
    onMutate: async ({ postId, like }) => {
      await queryClient.cancelQueries({ queryKey: keys.feed });
      const snapshot = queryClient.getQueryData<
        InfiniteData<Page<PostDto>, string | null>
      >(keys.feed);

      updatePostInFeed(queryClient, postId, (post) => {
        if (post.viewerHasLiked === like) return post;
        return {
          ...post,
          viewerHasLiked: like,
          likeCount: Math.max(0, post.likeCount + (like ? 1 : -1)),
        };
      });

      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(keys.feed, context.snapshot);
      }
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await apiFetch(`/api/v1/posts/${postId}`, voidSchema, {
        method: "DELETE",
      });
    },
    onSuccess: (_data, postId) => {
      removePostFromFeed(queryClient, postId);
    },
  });
}
