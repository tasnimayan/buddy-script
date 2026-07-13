import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

const SLOW_QUERY_MS = 200;

prisma.$on("query" as never, (e: { query: string; duration: number }) => {
  if (e.duration >= SLOW_QUERY_MS) {
    logger.warn(
      { prisma: true, durationMs: e.duration, query: e.query },
      "Slow query",
    );
  } else {
    logger.debug({ prisma: true, durationMs: e.duration }, "Query");
  }
});

prisma.$on("warn" as never, (e: { message: string }) => {
  logger.warn({ prisma: true }, e.message);
});

prisma.$on("error" as never, (e: { message: string }) => {
  logger.error({ prisma: true }, e.message);
});
