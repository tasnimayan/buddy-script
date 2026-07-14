import { Visibility } from "@prisma/client";
import type { CommentDto } from "../comments/types.js";

export interface CreatePostParams {
  authorId: string;
  content?: string | undefined;
  visibility: Visibility;
  mediaKeys?: string[] | undefined;
}

export interface PostAuthorDto {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface PostMediaDto {
  url: string;
  type: string;
  position: number;
}

export interface PostDto {
  id: string;
  content: string | null;
  visibility: Visibility;
  createdAt: string;
  media: PostMediaDto[];
  author: PostAuthorDto;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  /** Two oldest top-level comments; present on feed items only. */
  commentPreview?: CommentDto[];
}

export interface PostAuthorInput {
  id: string;
  firstName: string;
  lastName: string;
  avatarMediaKey: string | null;
}

export interface PostMediaInput {
  storageKey: string;
  mediaType: string;
  position: number;
}

export interface PostInput {
  id: bigint;
  content: string | null;
  visibility: Visibility;
  createdAt: Date;
  likeCount: bigint;
  commentCount: bigint;
}
