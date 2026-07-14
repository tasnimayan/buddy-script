import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/registration"];
const PROTECTED_PREFIXES = ["/feed"];
const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const EXPIRY_SKEW_MS = 30_000;

/** Unverified JWT exp check — cheap gate only; feed layout loads the real user. */
function isAccessJwtValid(token: string | undefined): boolean {
  if (!token) return false;
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadSegment, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return (
      typeof payload.exp === "number" &&
      payload.exp * 1000 > Date.now() + EXPIRY_SKEW_MS
    );
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessValid = isAccessJwtValid(
    request.cookies.get(ACCESS_COOKIE)?.value,
  );
  const hasRefresh = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);

  // Soft gate: valid access OR a refresh cookie (page will verify / sync).
  const canEnterProtected = accessValid || hasRefresh;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !canEnterProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && accessValid) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isProtected) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/registration",
    "/feed/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
