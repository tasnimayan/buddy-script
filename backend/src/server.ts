import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./db/index.js";
import { redis, redisRateLimit } from "./redis/index.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server started");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received, draining…");

  server.close(() => {
    logger.info("HTTP server closed");
  });

  const timeout = setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected");
  } catch (err) {
    logger.error({ err }, "Error disconnecting Prisma");
  }

  try {
    await redis.quit();
    logger.info("Redis disconnected");
  } catch (err) {
    logger.error({ err }, "Error disconnecting Redis");
  }

  try {
    await redisRateLimit.quit();
    logger.info("Redis (rate-limit) disconnected");
  } catch (err) {
    logger.error({ err }, "Error disconnecting Redis (rate-limit)");
  }

  clearTimeout(timeout);
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
