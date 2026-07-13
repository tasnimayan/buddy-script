export interface UserSummaryDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserDetailsDto extends UserSummaryDto {
  avatarMediaKey: string | null;
  bio: string | null;
  dob: string | null;
  gender: string | null;
  location: string | null;
  createdAt: string;
}

export interface UserWithProfile {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface FullUserWithProfile {
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

export interface RequestMeta {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
  requestId?: string | undefined;
}

export interface RegisterParams extends RequestMeta {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginParams extends RequestMeta {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResult {
  user: UserSummaryDto;
  accessToken: string;
  rawRefreshToken: string;
  rememberMe: boolean;
}
