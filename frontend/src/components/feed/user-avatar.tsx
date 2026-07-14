"use client";

import Image from "next/image";

import { DEFAULT_AVATAR } from "@/lib/posts/format";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size: number;
  className?: string;
}

/** Square crop + full circle — keeps stock CSS classes without oval/overflow brokenness. */
export function UserAvatar({
  src,
  alt = "",
  size,
  className,
}: UserAvatarProps) {
  return (
    <Image
      src={src || DEFAULT_AVATAR}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        maxWidth: size,
        objectFit: "cover",
        borderRadius: "50%",
        display: "block",
      }}
    />
  );
}
