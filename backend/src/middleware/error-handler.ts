import type { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import { Prisma } from "@prisma/client";
import { logger } from "../lib/logger.js";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    opts?: { code?: string; details?: Record<string, unknown> },
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(429, "Too many attempts. Try again later.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
  }
}

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "A record with that value already exists." },
  P2025: { status: 404, message: "Record not found." },
};

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.id as string | undefined;

  if (err instanceof AppError) {
    if (err instanceof RateLimitError) {
      res.set("Retry-After", String(err.retryAfterSeconds));
    }
    const body: Record<string, unknown> = { message: err.message };
    if (err.code) body.code = err.code;
    if (err.details) body.details = { ...err.details, requestId };
    else if (requestId) body.details = { requestId };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof z.ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_root";
      if (!fields[key]) fields[key] = [];
      fields[key]!.push(issue.message);
    }
    res.status(400).json({
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      details: { fields, requestId },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[err.code];
    if (mapped) {
      res.status(mapped.status).json({
        message: mapped.message,
        details: { requestId },
      });
      return;
    }
  }

  logger.error(
    { err, requestId, method: req.method, url: req.originalUrl },
    "Unhandled error",
  );

  res.status(500).json({
    message: "An unexpected error occurred.",
    details: { requestId },
  });
}
