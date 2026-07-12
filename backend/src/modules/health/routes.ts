import { Router } from "express";
import { prisma } from "../../db/index.js";
import { redis } from "../../redis/index.js";
import { logger } from "../../lib/logger.js";

const router = Router();

router.get("/health", async (_req, res) => {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = "ok";
  } catch (err) {
    logger.error({ err }, "Health check: Postgres failed");
    checks.postgres = "error";
    healthy = false;
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch (err) {
    logger.error({ err }, "Health check: Redis failed");
    checks.redis = "error";
    healthy = false;
  }

  if (healthy) {
    res.status(200).json({ status: "ok" });
  } else {
    res.status(503).json({ status: "degraded", details: checks });
  }
});

export default router;
