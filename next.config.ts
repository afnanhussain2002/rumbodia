import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

// Lets `next dev` read Cloudflare bindings (wrangler.jsonc) locally.
initOpenNextCloudflareForDev();
