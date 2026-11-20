/** Public base URL of the site. APP_URL overrides it per environment (no trailing slash). */
export const SITE_URL = process.env.APP_URL?.trim().replace(/\/+$/, "") || "https://rumbodia.site";

export const SITE_NAME = "Rumbodia";
export const SITE_TITLE = "Rumbodia: Which way is your day going?";
export const SITE_DESCRIPTION =
  "Rumbodia is a daily direction log. AI scores your updates from -10 to +10 against your goals and shows whether your days are trending up or down.";
