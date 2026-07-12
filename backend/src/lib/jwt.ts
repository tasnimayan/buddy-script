import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env.js";

const SECRET = new TextEncoder().encode(env.ACCESS_TOKEN_SECRET);
const ISSUER = "buddy-script";
const AUDIENCE = "buddy-script";
const ACCESS_TOKEN_TTL = "15m";

export interface AccessTokenPayload {
  sub: string; // userId
  sid: string; // sessionId (stringified BigInt)
}

export async function signAccessToken(
  userId: string,
  sessionId: bigint,
): Promise<string> {
  return new SignJWT({ sid: sessionId.toString() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(SECRET);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: 5,
  });

  const sub = payload.sub;
  const sid = (payload as JWTPayload & { sid?: string }).sid;

  if (!sub || !sid) {
    throw new Error("Invalid token claims");
  }

  return { sub, sid };
}
