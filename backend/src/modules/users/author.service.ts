import { prisma } from "../../db/index.js";
import type { PostAuthorInput } from "../posts/types.js";

/** Batched author hydration — one query for any number of user IDs. */
export async function fetchAuthorMap(
  userIds: string[],
): Promise<Map<string, PostAuthorInput>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: unique } },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      avatarMediaKey: true,
    },
  });

  return new Map(
    profiles.map((p) => [
      p.userId,
      {
        id: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        avatarMediaKey: p.avatarMediaKey,
      },
    ]),
  );
}

/** Profiles are created with the user at register; missing = data anomaly. */
export function fallbackAuthor(userId: string): PostAuthorInput {
  return { id: userId, firstName: "", lastName: "", avatarMediaKey: null };
}
