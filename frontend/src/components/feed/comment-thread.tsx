"use client";

import { useState } from "react";

import { keys } from "@/lib/posts/query-keys";
import { useComments, useCreateComment } from "@/lib/posts/use-comments";

import { CommentItem } from "./comment-item";
import { PostIcon } from "../icons";
import { UserAvatar } from "./user-avatar";

interface CommentThreadProps {
  postId: string;
  expanded: boolean;
}

export function CommentThread({ postId, expanded }: CommentThreadProps) {
  const [text, setText] = useState("");
  const createComment = useCreateComment(postId);
  const {
    data: comments = [],
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useComments(postId, expanded);

  if (!expanded) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || createComment.isPending) return;
    await createComment.mutateAsync({ content });
    setText("");
  };

  return (
    <>
      <div className="_feed_inner_timeline_cooment_area">
        <div className="_feed_inner_comment_box">
          <form
            className="_feed_inner_comment_box_form"
            onSubmit={(event) => void submit(event)}
          >
            <div className="_feed_inner_comment_box_content">
              <div className="_feed_inner_comment_box_content_image">
                <UserAvatar src={null} size={26} className="_comment_img" />
              </div>
              <div className="_feed_inner_comment_box_content_txt">
                <textarea
                  className="form-control _comment_textarea"
                  placeholder="Write a comment"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  disabled={createComment.isPending}
                  aria-label="Write a comment"
                />
              </div>
            </div>
            <div className="_feed_inner_comment_box_icon">
              <button
                type="submit"
                className="_feed_inner_comment_box_icon_btn"
                disabled={createComment.isPending || !text.trim()}
              >
                {createComment.isPending ? "…" : <PostIcon pathfill="#000" />}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="_timline_comment_main">
        {isLoading && (
          <div className="_previous_comment">
            <span className="_previous_comment_txt">Loading comments…</span>
          </div>
        )}
        {isError && (
          <div className="previous_comment">
            <span className="previous_comment_txt">
              Couldn&apos;t load comments.
            </span>
          </div>
        )}
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            listKey={keys.comments(postId)}
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
              {isFetchingNextPage ? "Loading…" : "View more comments"}
            </button>
          </div>
        )}
        {!isLoading && !isError && comments.length === 0 && (
          <div className="_previous_comment">
            <span className="previous_comment_txt">No comments yet.</span>
          </div>
        )}
      </div>
    </>
  );
}
