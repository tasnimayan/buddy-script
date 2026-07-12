/**
 * Explicit DTO mappers — the only path user data takes out of this module.
 * Never expose password_hash, token hashes, or session internals.
 */

export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface MeDto extends AuthUserDto {
  avatarMediaKey: string | null;
  bio: string | null;
  dob: string | null;
  gender: string | null;
  location: string | null;
  createdAt: string;
}

interface UserWithProfile {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  } | null;
}

interface FullUserWithProfile {
  id: string;
  email: string;
  createdAt: Date;
  profile: {
    firstName: string;
    lastName: string;
    avatarMediaKey: string | null;
    bio: string | null;
    dob: Date | null;
    gender: string | null;
    location: string | null;
  } | null;
}

export function toAuthUserDto(user: UserWithProfile): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.profile?.firstName ?? "",
    lastName: user.profile?.lastName ?? "",
  };
}

export function toMeDto(user: FullUserWithProfile): MeDto {
  return {
    ...toAuthUserDto(user),
    avatarMediaKey: user.profile?.avatarMediaKey ?? null,
    bio: user.profile?.bio ?? null,
    dob: user.profile?.dob?.toISOString() ?? null,
    gender: user.profile?.gender ?? null,
    location: user.profile?.location ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
