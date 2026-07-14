"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/browser";

import { keys } from "./query-keys";
import { feedPageSchema } from "./schemas";

export function useFeed() {
  return useInfiniteQuery({
    queryKey: keys.feed,
    queryFn: ({ pageParam }) =>
      apiFetch(
        `/api/v1/feed?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        feedPageSchema,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    select: (d) => d.pages.flatMap((p) => p.items),
  });
}
