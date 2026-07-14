"use client";

import { ThumbsUpIcon } from "../icons";

interface LikeButtonProps {
  liked: boolean;
  onToggle: () => void;
}

export function LikeButton({ liked, onToggle }: LikeButtonProps) {
  return (
    <button
      type="button"
      className={`_feed_inner_timeline_reaction_emoji _feed_reaction${liked ? " _feed_reaction_active" : ""}`}
      onClick={onToggle}
    >
      <span className="_feed_inner_timeline_reaction_link">
        <span>
          <ThumbsUpIcon width={16} height={16} fill="none" />
          {liked ? "Liked" : "Like"}
        </span>
      </span>
    </button>
  );
}
