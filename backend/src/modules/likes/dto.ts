import { toPostAuthorDto } from "../posts/dto.js";
import type { PostAuthorDto, PostAuthorInput } from "../posts/types.js";

export interface LikerDto {
  user: PostAuthorDto;
  likedAt: string;
}

export function toLikerDto(user: PostAuthorInput, likedAt: Date): LikerDto {
  return {
    user: toPostAuthorDto(user),
    likedAt: likedAt.toISOString(),
  };
}
