import { CacheService } from "../../cache/index.js";

/**
 * First page of the feed - post IDs only. TTL 10s - deleted on post create/delete.
 */
export const FEED_FIRSTPAGE_KEY = "feed:firstpage";
export const FEED_FIRSTPAGE_TTL_SECONDS = 10;

export async function invalidateFeedFirstPage(): Promise<void> {
  await CacheService.del(FEED_FIRSTPAGE_KEY);
}
