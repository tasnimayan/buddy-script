import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error-handler.js";

/**
 * Keyset-pagination cursor codec, reused by every paginated endpoint.
 *
 * Payload is `{ t, id }` where `t` is the exact Postgres `created_at::text`
 * of the last row (text, not a JS Date — Date truncates Postgres microsecond
 * precision and truncated cursors skip rows on equal-millisecond boundaries)
 * and `id` is the tiebreaker (BigInt PK or user UUID) as a string.
 *
 * The payload is HMAC-signed so tampered or garbage cursors fail with a 400
 * at decode time — never a 500 from a bad parse, and clients cannot probe
 * arbitrary keyset positions with forged cursors.
 */
export interface CursorPayload {
  t: string;
  id: string;
}

function sign(data: string): string {
  return createHmac("sha256", env.ACCESS_TOKEN_SECRET)
    .update(data)
    .digest("base64url");
}

export function encodeCursor(payload: CursorPayload): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${data}.${sign(data)}`;
}

export function decodeCursor(cursor: string): CursorPayload {
  const invalid = () => new AppError(400, "Invalid cursor.");

  const dot = cursor.indexOf(".");
  if (dot <= 0 || dot === cursor.length - 1) throw invalid();
  const data = cursor.slice(0, dot);
  const sig = cursor.slice(dot + 1);

  const expected = sign(data);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    throw invalid();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    throw invalid();
  }

  const payload = parsed as Partial<CursorPayload>;
  if (typeof payload.t !== "string" || typeof payload.id !== "string") {
    throw invalid();
  }

  return { t: payload.t, id: payload.id };
}

/**
 * Typed decoders: a cursor minted by one endpoint type presented at another
 * (BigInt id vs user UUID) is still validly signed, so the id shape must be
 * gated before any BigInt()/::uuid cast turns it into a 500.
 */
export function decodeBigIntCursor(cursor: string): { t: string; id: bigint } {
  const payload = decodeCursor(cursor);
  if (!/^\d+$/.test(payload.id)) {
    throw new AppError(400, "Invalid cursor.");
  }
  return { t: payload.t, id: BigInt(payload.id) };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function decodeUuidCursor(cursor: string): { t: string; id: string } {
  const payload = decodeCursor(cursor);
  if (!UUID_RE.test(payload.id)) {
    throw new AppError(400, "Invalid cursor.");
  }
  return { t: payload.t, id: payload.id };
}
