import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { v4 as uuidv4 } from "uuid";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import { attachAuth } from "./middleware/require-auth.js";
import { globalRateLimit } from "./middleware/rate-limit.js";
import healthRoutes from "./modules/health/routes.js";
import authRoutes from "./modules/auth/routes.js";

import type { IncomingMessage, ServerResponse } from "node:http";

// Crash guard: if a raw BigInt (Prisma BIGINT PK/FK) ever reaches
// JSON.stringify without going through a DTO mapper, serialize it as a
// string instead of throwing. DTOs remain the real contract.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (
  this: bigint,
) {
  return this.toString();
};

const app = express();

// Only trust X-Forwarded-For for the configured number of proxy
app.set("trust proxy", env.TRUST_PROXY);
app.disable("x-powered-by");

app.use(helmet());

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

app.use(express.json({ limit: "100kb" }));

app.use(cookieParser());

app.use(
  pinoHttp({
    logger,
    genReqId: () => uuidv4(),
    customLogLevel: (
      _req: IncomingMessage,
      res: ServerResponse,
      err: Error | undefined,
    ) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) =>
      `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req: IncomingMessage, res: ServerResponse) =>
      `${req.method} ${req.url} ${res.statusCode}`,
  }),
);

app.use("/api", healthRoutes);

// Global limiter for all feature routes: 300 req/min keyed by userId when
// authenticated (attachAuth identifies without rejecting), IP otherwise.
app.use("/api/v1", attachAuth, globalRateLimit);

app.use("/api/v1/auth", authRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
