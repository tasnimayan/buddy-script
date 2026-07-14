import { buildImageUrl } from "../../lib/cloudinary.js";
import { toPostAuthorDto } from "../posts/dto.js";
import type { PostAuthorInput } from "../posts/types.js";
import { CommentDto, CommentInput } from "./types.js";

export function toCommentDto(
  comment: CommentInput,
  author: PostAuthorInput,
  viewerHasLiked: boolean,
): CommentDto {
  return {
    id: comment.id.toString(),
    postId: comment.postId.toString(),
    parentCommentId: comment.parentCommentId?.toString() ?? null,
    content: comment.content,
    mediaUrl: comment.mediaKey ? buildImageUrl(comment.mediaKey) : null,
    createdAt: comment.createdAt.toISOString(),
    author: toPostAuthorDto(author),
    likeCount: Number(comment.likeCount),
    replyCount: Number(comment.replyCount),
    viewerHasLiked,
  };
}
