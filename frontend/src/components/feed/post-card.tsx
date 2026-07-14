"use client";

import { memo, useState } from "react";

import { useAuth } from "@/lib/auth/store";
import { displayName, formatRelativeTime } from "@/lib/posts/format";
import type { PostDto } from "@/lib/posts/types";

import { CommentIcon, MoreIcon, ShareIcon } from "../icons";
import { CommentThread } from "./comment-thread";
import { LikeButton } from "./like-button";
import { LikeCountPreview } from "./like-count-preview";
import { LikersModal } from "./likers-modal";
import { PostMediaGallery } from "./post-media-gallery";
import { UserAvatar } from "./user-avatar";

interface PostCardProps {
  post: PostDto;
  onToggleLike: (postId: string, like: boolean) => void;
  onDelete: (postId: string) => void;
}

export const PostCard = memo(function PostCard({
  post,
  onToggleLike,
  onDelete,
}: PostCardProps) {
  const user = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);

  const isOwner = user?.id === post.author.id;
  const mediaUrls = [...post.media]
    .sort((a, b) => a.position - b.position)
    .map((item) => item.url);

  return (
    <div>
      <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
        <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
          <div className="_feed_inner_timeline_post_top">
            <div className="_feed_inner_timeline_post_box">
              <div className="_feed_inner_timeline_post_box_image">
                <UserAvatar
                  src={post.author.avatarUrl}
                  size={44}
                  className="_post_img"
                />
              </div>
              <div className="_feed_inner_timeline_post_box_txt">
                <h4 className="_feed_inner_timeline_post_box_title">
                  {displayName(post.author)}
                </h4>
                <p className="_feed_inner_timeline_post_box_para">
                  {formatRelativeTime(post.createdAt)} .{" "}
                  <a href="#0">
                    {post.visibility === "private" ? "Private" : "Public"}
                  </a>
                </p>
              </div>
            </div>
            <div className="_feed_inner_timeline_post_box_dropdown">
              <div className="_feed_timeline_post_dropdown">
                <button
                  type="button"
                  className="_feed_timeline_post_dropdown_link"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <MoreIcon />
                </button>
              </div>

              <div
                className={`_feed_timeline_dropdown _timeline_dropdown${menuOpen ? " show" : ""}`}
              >
                <ul className="_feed_timeline_dropdown_list">
                  {isOwner && (
                    <li className="_feed_timeline_dropdown_item">
                      <a
                        href="#0"
                        className="_feed_timeline_dropdown_link"
                        onClick={(event) => {
                          event.preventDefault();
                          setMenuOpen(false);
                          onDelete(post.id);
                        }}
                      >
                        <span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            fill="none"
                            viewBox="0 0 18 18"
                          >
                            <path
                              stroke="#1890FF"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.2"
                              d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5"
                            />
                          </svg>
                        </span>
                        Delete Post
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          {post.content && (
            <h4
              className="_feed_inner_timeline_post_title"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {post.content}
            </h4>
          )}
          <PostMediaGallery urls={mediaUrls} />
        </div>

        {(post.likeCount > 0 || post.commentCount > 0) && (
          <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
            {post.likeCount > 0 ? (
              <LikeCountPreview
                likeCount={post.likeCount}
                onOpenLikers={() => setLikersOpen(true)}
              />
            ) : (
              <div />
            )}
            <div className="_feed_inner_timeline_total_reacts_txt">
              <p className="_feed_inner_timeline_total_reacts_para1">
                <a
                  href="#0"
                  onClick={(event) => {
                    event.preventDefault();
                    setCommentsExpanded(true);
                  }}
                >
                  <span>{post.commentCount}</span> Comment
                </a>
              </p>
            </div>
          </div>
        )}

        <div className="_feed_inner_timeline_reaction">
          <LikeButton
            liked={post.viewerHasLiked}
            onToggle={() => onToggleLike(post.id, !post.viewerHasLiked)}
          />
          <button
            type="button"
            className="_feed_inner_timeline_reaction_comment _feed_reaction"
            onClick={() => setCommentsExpanded((open) => !open)}
          >
            <span className="_feed_inner_timeline_reaction_link">
              <span>
                <CommentIcon />
                Comment
              </span>
            </span>
          </button>
          <button
            type="button"
            className="_feed_inner_timeline_reaction_share _feed_reaction"
          >
            <span className="_feed_inner_timeline_reaction_link">
              <span>
                <ShareIcon />
                Share
              </span>
            </span>
          </button>
        </div>

        <CommentThread postId={post.id} expanded={commentsExpanded} />
      </div>

      <LikersModal
        open={likersOpen}
        onClose={() => setLikersOpen(false)}
        target={{ kind: "post", id: post.id }}
        title="People who liked this post"
      />
    </div>
  );
});
