import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

function createClient(name: string): Redis {
  const useTls = env.REDIS_URL.startsWith("rediss://");

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      logger.info({ redis: name, attempt: times, delay }, "Redis reconnecting");
      return delay;
    },
    ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
  });

  client.on("connect", () => {
    logger.info({ redis: name }, "Redis connected");
  });

  client.on("ready", () => {
    logger.info({ redis: name }, "Redis ready");
  });

  client.on("error", (err: Error) => {
    logger.error({ redis: name, err }, "Redis error");
  });

  client.on("close", () => {
    logger.info({ redis: name }, "Redis connection closed");
  });

  return client;
}

// Shared connection for caching and general use
export const redis = createClient("shared");

// Dedicated connection for rate limiting
export const redisRateLimit = createClient("rate-limit");
