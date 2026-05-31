import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard/admin") && token?.role !== "ADMIN" && token?.role !== "SUBADMIN") {
      return Response.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/users") && token?.role !== "ADMIN" && token?.role !== "SUBADMIN") {
      return Response.redirect(new URL("/dashboard", req.url));
    }

    // Main Mediators Hub is Admin only
    if (path === "/dashboard/mediators" && token?.role !== "ADMIN") {
      return Response.redirect(new URL("/dashboard", req.url));
    }

    // Sub-pages in mediators like analytics/support are for Mediators
    if (path.startsWith("/dashboard/mediators/") && token?.role !== "MEDIATOR" && token?.role !== "ADMIN") {
      return Response.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/mediations") && token?.role !== "MEDIATOR") {
      return Response.redirect(new URL("/dashboard", req.url));
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
  matcher: ["/dashboard/:path*"],
};
