"use client";

import { useState } from "react";
import type { QueryKey } from "@tanstack/react-query";
import Image from "next/image";

import { useAuth } from "@/lib/auth/store";
import { displayName, formatRelativeTime } from "@/lib/posts/format";
import { keys } from "@/lib/posts/query-keys";
import type { CommentDto } from "@/lib/posts/types";
import {
  useCommentLike,
  useCreateComment,
  useDeleteComment,
  useReplies,
} from "@/lib/posts/use-comments";

import { LikersModal } from "./likers-modal";
import { UserAvatar } from "./user-avatar";
import { PostIcon, ThumbsUpIcon } from "../icons";

interface CommentItemProps {
  comment: CommentDto;
  postId: string;
  listKey: QueryKey;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  listKey,
  isReply = false,
}: CommentItemProps) {
  const user = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [likersOpen, setLikersOpen] = useState(false);

  const likeMutation = useCommentLike(listKey);
  const deleteMutation = useDeleteComment(postId, listKey, {
    parentCommentId: comment.parentCommentId,
    replyCount: comment.replyCount,
  });
  const createReply = useCreateComment(postId);
  const {
    data: replies = [],
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: repliesLoading,
  } = useReplies(comment.id, showReplies && !isReply);

  const isOwner = user?.id === comment.author.id;

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = replyText.trim();
    if (!content || createReply.isPending) return;
    await createReply.mutateAsync({
      content,
      parentCommentId: comment.id,
    });
    setReplyText("");
    setReplyOpen(false);
    setShowReplies(true);
  };

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <a href="#0" className="_comment_image_link">
          <UserAvatar
            src={comment.author.avatarUrl}
            size={40}
            className="_comment_img1"
          />
        </a>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <a href="#0">
                <h4 className="_comment_name_title">
                  {displayName(comment.author)}
                </h4>
              </a>
            </div>
          </div>
          {comment.content && (
            <div className="comment_status">
              <p
                className="comment_status_text"
                style={{ whiteSpace: "pre-wrap" }}
              >
                <span>{comment.content}</span>
              </p>
            </div>
          )}
          {comment.mediaUrl && (
            <div className="_feed_inner_timeline_image">
              <Image
                width={240}
                height={180}
                src={comment.mediaUrl}
                alt=""
                className="_time_img"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
          )}
          {comment.likeCount > 0 && (
            <div
              className="_total_reactions"
              role="button"
              tabIndex={0}
              onClick={() => setLikersOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setLikersOpen(true);
                }
              }}
            >
              <div className="_total_react">
                <span className="_reaction_like">
                  <ThumbsUpIcon />
                </span>
              </div>
              <span className="_total">{comment.likeCount}</span>
            </div>
          )}
          <div className="_comment_reply">
            <div className="comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      likeMutation.mutate({
                        commentId: comment.id,
                        like: !comment.viewerHasLiked,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        likeMutation.mutate({
                          commentId: comment.id,
                          like: !comment.viewerHasLiked,
                        });
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      fontWeight: comment.viewerHasLiked ? 600 : undefined,
                    }}
                  >
                    {comment.viewerHasLiked ? "Unlike" : "Like"}.
                  </span>
                </li>
                {!isReply && (
                  <li>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => setReplyOpen((open) => !open)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setReplyOpen((open) => !open);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      Reply.
                    </span>
                  </li>
                )}
                {isOwner && (
                  <li>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => deleteMutation.mutate(comment.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          deleteMutation.mutate(comment.id);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      Delete.
                    </span>
                  </li>
                )}
                <li>
                  <span className="_time_link">
                    .{formatRelativeTime(comment.createdAt)}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {replyOpen && !isReply && (
          <div className="_feed_inner_comment_box">
            <form
              className="_feed_inner_comment_box_form"
              onSubmit={(event) => void submitReply(event)}
            >
              <div className="_feed_inner_comment_box_content">
                <div className="feed_inner_comment_box_content_image">
                  <UserAvatar src={null} size={26} className="_comment_img" />
                </div>
                <div className="_feed_inner_comment_box_content_txt">
                  <textarea
                    className="form-control _comment_textarea"
                    placeholder="Write a comment"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    disabled={createReply.isPending}
                  />
                </div>
              </div>
              <div className="_feed_inner_comment_box_icon">
                <button
                  type="submit"
                  className="_feed_inner_comment_box_icon_btn"
                  disabled={createReply.isPending || !replyText.trim()}
                >
                  {createReply.isPending ? "…" : <PostIcon pathfill="#000" />}
                </button>
              </div>
            </form>
          </div>
        )}

        {!isReply && comment.replyCount > 0 && !showReplies && (
          <div className="previous_comment">
            <button
              type="button"
              className="_previous_comment_txt"
              onClick={() => setShowReplies(true)}
            >
              View replies ({comment.replyCount})
            </button>
          </div>
        )}

        {showReplies && !isReply && (
          <div>
            {repliesLoading && <p className="previous_comment_txt">Loading…</p>}
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                listKey={keys.replies(comment.id)}
                isReply
              />
            ))}
            {hasNextPage && (
              <div className="_previous_comment">
                <button
                  type="button"
                  className="_previous_comment_txt"
                  disabled={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                >
                  {isFetchingNextPage ? "Loading…" : "View more replies"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <LikersModal
        open={likersOpen}
        onClose={() => setLikersOpen(false)}
        target={{ kind: "comment", id: comment.id }}
        title="People who liked this comment"
      />
    </div>
  );
}
