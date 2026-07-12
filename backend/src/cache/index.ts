import { redis } from "../redis/index.js";
import { logger } from "../lib/logger.js";

const KEY_PREFIX = "bs:";

export const CacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(`${KEY_PREFIX}${key}`);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.error({ err, key }, "CacheService.get failed (fail-open)");
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const raw = JSON.stringify(value);
      await redis.set(`${KEY_PREFIX}${key}`, raw, "EX", ttlSeconds);
    } catch (err) {
      logger.error({ err, key }, "CacheService.set failed (fail-open)");
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(`${KEY_PREFIX}${key}`);
    } catch (err) {
      logger.error({ err, key }, "CacheService.del failed (fail-open)");
    }
  },
};
