-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- Snowflake ID infrastructure (must precede any table that defaults a column to snowflake_id())
CREATE SEQUENCE IF NOT EXISTS global_id_seq;

CREATE OR REPLACE FUNCTION snowflake_id() RETURNS BIGINT AS $$
DECLARE
  epoch_ms  BIGINT := 1720000000000; -- custom epoch: 2024-07-03T00:00:00Z
  now_ms    BIGINT;
  shard_id  INT := 0;
  seq_val   BIGINT;
  result    BIGINT;
BEGIN
  now_ms  := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT - epoch_ms;
  seq_val := nextval('global_id_seq') % 4096;
  -- Layout: 42 bits timestamp | 10 bits shard | 12 bits sequence
  result := (now_ms << 22) | (shard_id << 12) | seq_val;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "avatar_media_key" VARCHAR(512),
    "bio" VARCHAR(500),
    "dob" DATE,
    "gender" "Gender",
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" BIGINT NOT NULL DEFAULT snowflake_id(),
    "user_id" UUID NOT NULL,
    "session_token_hash" VARCHAR(255) NOT NULL,
    "user_agent" VARCHAR(255),
    "ip_address" INET,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" BIGINT NOT NULL DEFAULT snowflake_id(),
    "author_id" UUID NOT NULL,
    "content" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "media_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" BIGINT NOT NULL DEFAULT 0,
    "comment_count" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" BIGINT NOT NULL DEFAULT snowflake_id(),
    "post_id" BIGINT NOT NULL,
    "storage_key" VARCHAR(512) NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "extension" VARCHAR(10) NOT NULL,
    "byte_size" BIGINT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" BIGINT NOT NULL DEFAULT snowflake_id(),
    "post_id" BIGINT NOT NULL,
    "author_id" UUID NOT NULL,
    "parent_comment_id" BIGINT,
    "content" TEXT,
    "media_key" VARCHAR(512),
    "like_count" BIGINT NOT NULL DEFAULT 0,
    "reply_count" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "post_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("post_id","user_id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "comment_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("comment_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_profiles_user" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_session_token_hash_key" ON "auth_sessions"("session_token_hash");

-- CreateIndex
CREATE INDEX "idx_sessions_user" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_post_media_order" ON "media"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_post_id_position_key" ON "media"("post_id", "position");

-- CreateIndex
CREATE INDEX "idx_post_likes_recent" ON "post_likes"("post_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_comment_likes_recent" ON "comment_likes"("comment_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK: a comment must have content or media (or both)
ALTER TABLE "comments" ADD CONSTRAINT "chk_comment_has_body"
  CHECK (content IS NOT NULL OR media_key IS NOT NULL);

-- Partial indexes (not expressible in Prisma @@index)
CREATE INDEX idx_posts_public_feed
  ON posts (created_at DESC, id DESC)
  WHERE visibility = 'public' AND deleted_at IS NULL;

CREATE INDEX idx_posts_by_author
  ON posts (author_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_comments_toplevel
  ON comments (post_id, created_at, id)
  WHERE parent_comment_id IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_comments_replies
  ON comments (parent_comment_id, created_at, id)
  WHERE deleted_at IS NULL;
