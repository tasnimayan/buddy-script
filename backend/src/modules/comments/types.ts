import { PostAuthorDto } from "../posts/types.js";

export interface CreateCommentParams {
  viewerId: string;
  postId: bigint;
  content?: string | undefined;
  mediaKey?: string | undefined;
  parentCommentId?: bigint | undefined;
}

export interface CommentRow {
  id: bigint;
  post_id: bigint;
  author_id: string;
  parent_comment_id: bigint | null;
  content: string | null;
  media_key: string | null;
  like_count: bigint;
  reply_count: bigint;
  created_at: Date;
  created_at_str: string;
}

export interface CommentDto {
  id: string;
  postId: string;
  parentCommentId: string | null;
  content: string | null;
  mediaUrl: string | null;
  createdAt: string;
  author: PostAuthorDto;
  likeCount: number;
  replyCount: number;
  viewerHasLiked: boolean;
}

export interface CommentInput {
  id: bigint;
  postId: bigint;
  parentCommentId: bigint | null;
  content: string | null;
  mediaKey: string | null;
  createdAt: Date;
  likeCount: bigint;
  replyCount: bigint;
}
