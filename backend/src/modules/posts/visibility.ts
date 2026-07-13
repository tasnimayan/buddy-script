import { Prisma, Visibility } from "@prisma/client";

// Soft-deleted posts are invisible, private posts are visible to their author only.
export function postVisibleWhere(viewerId: string): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    OR: [{ visibility: Visibility.public }, { authorId: viewerId }],
  };
}

// Same predicate for raw SQL (feed core query, comment lists).
export function postVisibleSql(viewerId: string, alias = "p"): Prisma.Sql {
  const col = (name: string) => Prisma.raw(`${alias}.${name}`);
  return Prisma.sql`${col("deleted_at")} IS NULL AND (${col("visibility")} = 'public' OR ${col("author_id")} = ${viewerId}::uuid)`;
}
