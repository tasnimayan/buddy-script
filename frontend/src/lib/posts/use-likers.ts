"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/browser";

import { keys } from "./query-keys";
import { likersPageSchema } from "./schemas";

type LikersTarget =
  | { kind: "post"; id: string }
  | { kind: "comment"; id: string };

export function useLikers(target: LikersTarget, open: boolean) {
  const queryKey =
    target.kind === "post"
      ? keys.postLikers(target.id)
      : keys.commentLikers(target.id);

  const path =
    target.kind === "post"
      ? `/api/v1/posts/${target.id}/likes`
      : `/api/v1/comments/${target.id}/likes`;

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      apiFetch(
        `${path}?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        likersPageSchema,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: open,
    staleTime: 0,
    gcTime: 60_000,
    select: (d) => d.pages.flatMap((p) => p.items),
  });
}
