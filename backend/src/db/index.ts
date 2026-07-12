import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

prisma.$on("warn" as never, (e: { message: string }) => {
  logger.warn({ prisma: true }, e.message);
});

prisma.$on("error" as never, (e: { message: string }) => {
  logger.error({ prisma: true }, e.message);
});
