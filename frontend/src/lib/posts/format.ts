import {
  parseISO,
  isValid,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";

export function formatRelativeTime(iso: string): string {
  const then = parseISO(iso);
  if (!isValid(then)) return "";

  const now = Date.now();
  const seconds = Math.max(0, differenceInSeconds(now, then));
  if (seconds < 60) return "just now";

  const minutes = differenceInMinutes(now, then);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = differenceInHours(now, then);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = differenceInDays(now, then);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return then.toLocaleDateString();
}

export function displayName(user: {
  firstName: string;
  lastName: string;
}): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export const DEFAULT_AVATAR = "/images/txt_img.png";
