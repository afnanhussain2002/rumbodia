import "server-only";

/** Public base URL for Stripe redirects. Set APP_URL in production (for example https://rumbodia.com). */
export function appOrigin(request: Request): string {
  const fromEnv = process.env.APP_URL?.trim().replace(/\/+$/, "");
  return fromEnv || new URL(request.url).origin;
}
