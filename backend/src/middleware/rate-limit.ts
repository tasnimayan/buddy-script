import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  RateLimiterRedis,
  RateLimiterMemory,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { redisRateLimit } from "../redis/index.js";
import { RateLimitError } from "./error-handler.js";
import { audit } from "../lib/audit.js";

// All limiters are Redis-backed (cluster-wide, restart-surviving).

interface LimiterSpec {
  keyPrefix: string;
  points: number;
  durationSeconds: number;
}

function createLimiter(spec: LimiterSpec): RateLimiterRedis {
  return new RateLimiterRedis({
    storeClient: redisRateLimit,
    keyPrefix: `bs:rl:${spec.keyPrefix}`,
    points: spec.points,
    duration: spec.durationSeconds,
    insuranceLimiter: new RateLimiterMemory({
      keyPrefix: `bs:rl:ins:${spec.keyPrefix}`,
      points: Math.max(1, Math.floor(spec.points / 2)),
      duration: spec.durationSeconds,
    }),
  });
}

// Milestone 3 limits
const loginIpLimiter = createLimiter({
  keyPrefix: "login:ip",
  points: 5,
  durationSeconds: 15 * 60,
});
const loginEmailLimiter = createLimiter({
  keyPrefix: "login:email",
  points: 10,
  durationSeconds: 60 * 60,
});
const registerLimiter = createLimiter({
  keyPrefix: "register:ip",
  points: 10,
  durationSeconds: 60 * 60,
});
const refreshLimiter = createLimiter({
  keyPrefix: "refresh:ip",
  points: 30,
  durationSeconds: 60 * 60,
});

// Global limit 300 req/min per user (or IP when anonymous)
const globalLimiter = createLimiter({
  keyPrefix: "global",
  points: 300,
  durationSeconds: 60,
});

function clientIp(req: Request): string {
  return req.ip ?? "unknown";
}

function retryAfterSeconds(rlRes: RateLimiterRes): number {
  return Math.ceil(rlRes.msBeforeNext / 1000);
}

function rateLimitTrip(req: Request, scope: string): void {
  audit("auth.rate_limit", {
    scope,
    ipAddress: clientIp(req),
    requestId: req.id as string | undefined,
    userId: req.userId,
  });
}

/** Consume 1 point per request; 429 + Retry-After when exhausted. */
function consumingMiddleware(
  limiter: RateLimiterRedis,
  scope: string,
  keyFn: (req: Request) => string,
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await limiter.consume(keyFn(req));
      next();
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        rateLimitTrip(req, scope);
        next(new RateLimitError(retryAfterSeconds(err)));
        return;
      }
      next(err);
    }
  };
}

export const registerRateLimit = consumingMiddleware(
  registerLimiter,
  "register",
  clientIp,
);

export const refreshRateLimit = consumingMiddleware(
  refreshLimiter,
  "refresh",
  clientIp,
);

/**
 * Global API limiter: keyed by userId when authenticated (cookie present and
 * valid — requireAuth runs later, so key on userId if a prior middleware set
 * it, else IP). Mounted on /api/v1 only; /api/health is deliberately exempt.
 */
export const globalRateLimit = consumingMiddleware(
  globalLimiter,
  "global",
  (req) => req.userId ?? clientIp(req),
);

/**
 * Login limits count FAILURES only, so login flow is check-then-record:
 *  1. `assertLoginAllowed` before verifying credentials — 429 if either the
 *     IP or the email counter is already exhausted.
 *  2. `recordLoginFailure` after a failed attempt.
 *  3. `resetLoginFailures` on success — clears the email counter only
 *     (the per-IP counter is a brute-force signal and keeps its window).
 */
export async function assertLoginAllowed(
  req: Request,
  email: string,
): Promise<void> {
  const [ipState, emailState] = await Promise.all([
    loginIpLimiter.get(clientIp(req)),
    loginEmailLimiter.get(email),
  ]);

  const blockedWaits: number[] = [];
  if (ipState && ipState.consumedPoints >= loginIpLimiter.points) {
    blockedWaits.push(ipState.msBeforeNext);
  }
  if (emailState && emailState.consumedPoints >= loginEmailLimiter.points) {
    blockedWaits.push(emailState.msBeforeNext);
  }

  if (blockedWaits.length > 0) {
    rateLimitTrip(req, "login");
    throw new RateLimitError(Math.ceil(Math.max(...blockedWaits) / 1000));
  }
}

export async function recordLoginFailure(
  req: Request,
  email: string,
): Promise<void> {
  const swallow = (err: unknown) => {
    if (!(err instanceof RateLimiterRes)) throw err;
  };
  await Promise.all([
    loginIpLimiter.consume(clientIp(req)).catch(swallow),
    loginEmailLimiter.consume(email).catch(swallow),
  ]);
}

export async function resetLoginFailures(email: string): Promise<void> {
  await loginEmailLimiter.delete(email);
}
