import {
  UserSummaryDto,
  UserDetailsDto,
  UserWithProfile,
  FullUserWithProfile,
} from "./types.js";

export function toUserSummaryDto(user: UserWithProfile): UserSummaryDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.profile?.firstName ?? "",
    lastName: user.profile?.lastName ?? "",
  };
}

export function toUserDetailsDto(user: FullUserWithProfile): UserDetailsDto {
  return {
    ...toUserSummaryDto(user),
    avatarMediaKey: user.profile?.avatarMediaKey ?? null,
    bio: user.profile?.bio ?? null,
    dob: user.profile?.dob?.toISOString() ?? null,
    gender: user.profile?.gender ?? null,
    location: user.profile?.location ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
