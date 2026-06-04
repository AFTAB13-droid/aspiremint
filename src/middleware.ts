import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Enforce Admin MFA redirection
    if (token?.mfaPending && path !== "/admin/mfa") {
      return Response.redirect(new URL("/admin/mfa", req.url));
    }

    if (!token?.mfaPending && path === "/admin/mfa") {
      return Response.redirect(new URL("/app", req.url));
    }

    if (path.startsWith("/app/admin") && token?.role !== "ADMIN" && token?.role !== "SUBADMIN") {
      return Response.redirect(new URL("/app", req.url));
    }

    if (path.startsWith("/app/users") && token?.role !== "ADMIN" && token?.role !== "SUBADMIN") {
      return Response.redirect(new URL("/app", req.url));
    }

    // Main Mediators Hub is Admin only
    if (path === "/app/mediators" && token?.role !== "ADMIN") {
      return Response.redirect(new URL("/app", req.url));
    }

    // Sub-pages in mediators like analytics/support are for Mediators
    if (path.startsWith("/app/mediators/") && token?.role !== "MEDIATOR" && token?.role !== "ADMIN") {
      return Response.redirect(new URL("/app", req.url));
    }

    if (path.startsWith("/app/mediations") && token?.role !== "MEDIATOR") {
      return Response.redirect(new URL("/app", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect the dashboard and any other private routes
export const config = {
  matcher: ["/app/:path*", "/admin/mfa"],
};
