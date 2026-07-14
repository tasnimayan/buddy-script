import { buildImageUrl, buildAvatarUrl } from "../../lib/cloudinary.js";
import type { CommentDto } from "../comments/types.js";
import type {
  PostAuthorDto,
  PostDto,
  PostAuthorInput,
  PostInput,
  PostMediaInput,
} from "./types.js";

export function toPostAuthorDto(author: PostAuthorInput): PostAuthorDto {
  return {
    id: author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    avatarUrl: buildAvatarUrl(author.avatarMediaKey),
  };
}

export function toPostDto(
  post: PostInput,
  author: PostAuthorInput,
  media: PostMediaInput[],
  viewerHasLiked: boolean,
  commentPreview?: CommentDto[],
): PostDto {
  const dto: PostDto = {
    id: post.id.toString(),
    content: post.content,
    visibility: post.visibility,
    createdAt: post.createdAt.toISOString(),
    media: media.map((m) => ({
      url: buildImageUrl(m.storageKey),
      type: m.mediaType,
      position: m.position,
    })),
    author: toPostAuthorDto(author),
    likeCount: Number(post.likeCount),
    commentCount: Number(post.commentCount),
    viewerHasLiked,
  };
  if (commentPreview) dto.commentPreview = commentPreview;
  return dto;
}
