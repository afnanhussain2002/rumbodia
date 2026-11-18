import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rumbodia",
    short_name: "Rumbodia",
    description: "Which way is your day going?",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#F2F3F7",
    theme_color: "#13A38B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
