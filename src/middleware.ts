import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. Unauthenticated Guest Users
    if (!token) {
      // Allowed public guest routes: login, signup/register, forgot-password, registration-pending, review-finder
      const isAllowedPublicPath =
        path === "/login" ||
        path === "/signup" ||
        path === "/forgot-password" ||
        path === "/registration-pending" ||
        path === "/app/review-finder";

      // If guest clicks or navigates to any other path (e.g. /, /app, /app/orders, /app/activedeals, /app/refunds, etc.)
      if (!isAllowedPublicPath) {
        return NextResponse.redirect(new URL("/app/review-finder", req.url));
      }
      return NextResponse.next();
    }

    // 2. Authenticated Logged-In Users
    // Redirect authenticated users away from public auth pages to dashboard
    if (path === "/login" || path === "/signup" || path === "/" || path === "/forgot-password") {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    // Enforce Admin MFA redirection
    if (token?.mfaPending && path !== "/admin/mfa") {
      return NextResponse.redirect(new URL("/admin/mfa", req.url));
    }

    if (!token?.mfaPending && path === "/admin/mfa") {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    if (path.startsWith("/app/admin") && token?.role !== "ADMIN" && token?.role !== "SUBADMIN") {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    if (path.startsWith("/app/users") && token?.role !== "ADMIN" && token?.role !== "SUBADMIN") {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    // Main Mediators Hub is Admin only
    if (path === "/app/mediators" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    // Sub-pages in mediators like analytics/support are for Mediators
    if (path.startsWith("/app/mediators/") && token?.role !== "MEDIATOR" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    if (path.startsWith("/app/mediations") && token?.role !== "MEDIATOR") {
      return NextResponse.redirect(new URL("/app", req.url));
    }
  },
  {
    callbacks: {
      // By returning true here, NextAuth does not automatically redirect unauthenticated users to /login.
      // Our middleware logic above explicitly redirects unauthenticated users to /app/review-finder.
      authorized: () => true,
    },
  }
);

// Protect the dashboard, auth routes, and any other private routes
export const config = {
  matcher: [
    "/app/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/registration-pending",
    "/",
  ],
};
