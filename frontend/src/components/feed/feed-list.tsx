"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { useDeletePost, usePostLike } from "@/lib/posts/use-post-mutations";
import { useFeed } from "@/lib/posts/use-feed";

import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";
import { FeedStory } from "./feed-story";

function resolveScrollElement(preferred: HTMLElement): HTMLElement {
  let node: HTMLElement | null = preferred;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      if (node.scrollHeight > node.clientHeight + 1) {
        return node;
      }
      // Constrained viewport that will scroll once content overflows (desktop).
      const { height } = node.getBoundingClientRect();
      if (height > 0 && height < window.innerHeight - 10) {
        return node;
      }
    }
    node = node.parentElement;
  }
  return document.documentElement;
}

function measureScrollMargin(list: HTMLElement, scrollEl: HTMLElement): number {
  const listRect = list.getBoundingClientRect();
  if (scrollEl === document.documentElement) {
    return listRect.top + window.scrollY;
  }
  const scrollRect = scrollEl.getBoundingClientRect();
  return listRect.top - scrollRect.top + scrollEl.scrollTop;
}

export function FeedList() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const {
    data: posts = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    isError,
    error,
  } = useFeed();

  const { mutate: toggleLike } = usePostLike();
  const { mutate: deletePost } = useDeletePost();

  const onToggleLike = useCallback(
    (postId: string, like: boolean) => {
      toggleLike({ postId, like });
    },
    [toggleLike],
  );

  const onDelete = useCallback(
    (postId: string) => {
      deletePost(postId);
    },
    [deletePost],
  );

  const rowCount = hasNextPage ? posts.length + 1 : posts.length;

  useLayoutEffect(() => {
    const preferred = scrollRef.current;
    const list = listRef.current;
    if (!preferred || !list) return;

    const nextScrollEl = resolveScrollElement(preferred);
    setScrollElement(nextScrollEl);
    setScrollMargin(measureScrollMargin(list, nextScrollEl));
  }, [isLoading, posts.length, rowCount]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => 420,
    overscan: 5,
    scrollMargin,
    getItemKey: (index) => posts[index]?.id ?? "loader",
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= posts.length - 1 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [
    virtualItems,
    posts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  return (
    <div className="_layout_middle_wrap" ref={scrollRef}>
      <div className="_layout_middle_inner">
        <FeedStory />
        <PostComposer />

        {isLoading && (
          <p className="_previous_comment_txt _padd_l24">Loading feed…</p>
        )}
        {isError && (
          <p className="_previous_comment_txt _padd_l24" role="alert">
            {error instanceof Error ? error.message : "Couldn't load the feed."}
          </p>
        )}
        {!isLoading && !isError && posts.length === 0 && (
          <p className="_previous_comment_txt _padd_l24">
            No posts yet. Be the first to share something.
          </p>
        )}

        <div
          ref={listRef}
          style={{
            position: "relative",
            height: virtualizer.getTotalSize(),
            width: "100%",
          }}
        >
          {virtualItems.map((item) => {
            const isLoader = item.index >= posts.length;
            const post = posts[item.index];

            return (
              <div
                key={item.key}
                data-index={item.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                {isLoader ? (
                  <p className="_previous_comment_txt _padd_l24">
                    {isFetchingNextPage ? "Loading more…" : null}
                  </p>
                ) : post ? (
                  <PostCard
                    post={post}
                    onToggleLike={onToggleLike}
                    onDelete={onDelete}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
