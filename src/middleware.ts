import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect authenticated users away from public/auth pages instantly
    if (token && (path === "/login" || path === "/signup" || path === "/")) {
      return NextResponse.redirect(new URL("/app", req.url));
    }

    // Redirect unauthenticated guest visitors to Review Finder
    if (!token && (path === "/" || path === "/app")) {
      return NextResponse.redirect(new URL("/app/review-finder", req.url));
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
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Public paths don't require a token
        if (
          path === "/login" ||
          path === "/signup" ||
          path === "/" ||
          path === "/app/review-finder"
        ) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect the dashboard, auth routes, and any other private routes
export const config = {
  matcher: ["/app/:path*", "/admin/mfa", "/login", "/signup", "/"],
};
