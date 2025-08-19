// perfectly safe for the Edge environment

import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
 
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute =
    nextUrl.pathname.startsWith("/sign-in") ||
    nextUrl.pathname.startsWith("/sign-up") ||
    nextUrl.pathname.startsWith("/verify") ||
    nextUrl.pathname === "/";

  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

  // Logic 1: If the user is logged in, redirect them from auth routes to the dashboard.
  if (isLoggedIn && isAuthRoute) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // Logic 2: If the user is not logged in, redirect them from protected routes to the sign-in page.
  if (!isLoggedIn && isProtectedRoute) {
    return Response.redirect(new URL("/sign-in", nextUrl));
  }

  // If neither of the above conditions is met, allow the request to proceed.
  return;
});

// This config applies the middleware to the specified routes.
export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up", "/", "/verify/:path*"],
};
