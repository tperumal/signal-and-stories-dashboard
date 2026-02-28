import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow API routes (they verify tokens themselves)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow static assets
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Skip auth check if Firebase is not configured
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
