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
import healthRoutes from "./modules/health/routes.js";

import type { IncomingMessage, ServerResponse } from "node:http";

const app = express();

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

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
