import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache yet: every page here is dynamic (signed-in data), so there's little to cache.
// Add an R2 bucket later if static pages need ISR caching.
export default defineCloudflareConfig({});
