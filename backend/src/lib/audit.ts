import { logger } from "./logger.js";

// Security audit trail. Structured events only
export type AuditEvent =
  | "auth.register"
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.refresh"
  | "auth.refresh.reuse_detected"
  | "auth.logout"
  | "auth.rate_limit";

export interface AuditContext {
  userId?: string;
  email?: string;
  sessionId?: string;
  ipAddress?: string | undefined;
  requestId?: string | undefined;
  scope?: string;
}

export function audit(event: AuditEvent, ctx: AuditContext): void {
  logger.info({ audit: true, event, ...ctx }, `audit: ${event}`);
}
