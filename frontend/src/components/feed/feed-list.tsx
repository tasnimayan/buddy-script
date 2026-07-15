"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { useDeletePost, usePostLike } from "@/lib/posts/use-post-mutations";
import { useFeed } from "@/lib/posts/use-feed";

import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";
import { FeedStory } from "./feed-story";

export function FeedList() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  const armedRef = useRef(false);
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

  fetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const list = listRef.current;
    if (!scrollEl || !list || isLoading) return;

    const measure = () => {
      const listRect = list.getBoundingClientRect();
      const scrollRect = scrollEl.getBoundingClientRect();
      setScrollMargin(listRect.top - scrollRect.top + scrollEl.scrollTop);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [isLoading]);

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 420,
    overscan: 5,
    scrollMargin,
    getItemKey: (index) => posts[index]?.id ?? index,
  });

  const listHeight = posts.length === 0 ? 0 : virtualizer.getTotalSize();

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!scrollEl || !sentinel || !hasNextPage || isLoading) return;

    armedRef.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        // Arm only after the sentinel has left the scrollport. That means the
        // feed is actually scrollable and the user (or layout) moved past end.
        if (!entry.isIntersecting) {
          armedRef.current = true;
          return;
        }

        if (!armedRef.current || fetchingRef.current) return;
        void fetchNextPage();
      },
      // Always observe against the column scrollport (overflow: auto), never the
      // viewport — otherwise a flex-shrunk list keeps the sentinel on-screen.
      { root: scrollEl, rootMargin: "0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isLoading, fetchNextPage]);

  const virtualItems = virtualizer.getVirtualItems();

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
            flexShrink: 0,
            height: listHeight,
            width: "100%",
          }}
        >
          {virtualItems.map((item) => {
            const post = posts[item.index];
            if (!post) return null;

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
                  transform: `translateY(${item.start - scrollMargin}px)`,
                }}
              >
                <PostCard
                  post={post}
                  onToggleLike={onToggleLike}
                  onDelete={onDelete}
                />
              </div>
            );
          })}
        </div>

        {hasNextPage && !isLoading && (
          <div
            ref={sentinelRef}
            aria-hidden
            style={{ height: 1, width: "100%", flexShrink: 0 }}
          />
        )}
        {isFetchingNextPage && (
          <p className="_previous_comment_txt _padd_l24">Loading more…</p>
        )}
      </div>
    </div>
  );
}
