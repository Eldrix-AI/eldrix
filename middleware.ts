import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = Boolean(token);

  // Public auth pages
  const authPages = ["/login", "/signup", "/reset"];
  const isAuthPage = authPages.some((page) => pathname === page);

  // Onboarding pages (allow authenticated users to access)
  const isOnboardingPage = pathname.startsWith("/app/onboarding");

  // 1. Unauthenticated → trying to hit /app/* → send to login
  if (!isAuthenticated && pathname.startsWith("/app")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated → visiting /login, /signup, or /reset → send to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/app/dashboard", req.url));
  }

  // 3. Allow authenticated users to access onboarding pages
  if (isAuthenticated && isOnboardingPage) {
    return NextResponse.next();
  }

  // 4. Otherwise let it through (this also covers all your public pages)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // run on /app/* AND on your auth pages
    "/app/:path*",
    "/login",
    "/signup",
    "/reset",
  ],
};
