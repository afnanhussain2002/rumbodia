import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/** Pages that need a signed-in user. The landing page and the sign-in/up pages stay public. */
const isProtectedPage = createRouteMatcher(["/app(.*)"]);

/**
 * Clerk reads the session here for every request.
 * Only pages are redirected to sign-in. API routes answer 401 JSON themselves
 * (see requireUserId) so the client can show a message instead of a login page.
 */
export default clerkMiddleware(async (auth, request) => {
  if (isProtectedPage(request)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
