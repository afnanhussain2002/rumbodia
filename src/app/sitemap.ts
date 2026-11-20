import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { POSTS, postPath } from "@/features/blog/posts";

type Entry = MetadataRoute.Sitemap[number];

/** Public pages only. Never list /app/*, /api/* or anything behind sign-in. */
const staticPages: Entry[] = [
  { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
  { url: `${SITE_URL}/sign-in`, changeFrequency: "yearly", priority: 0.5 },
  { url: `${SITE_URL}/sign-up`, changeFrequency: "yearly", priority: 0.5 },
  { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
];

/** The blog index plus every post, dated by its last real change. */
function blogPages(): Entry[] {
  const latest = POSTS.map((p) => p.updated ?? p.published).sort().at(-1);
  return [
    { url: `${SITE_URL}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
    ...POSTS.map((p) => ({
      url: `${SITE_URL}${postPath(p.slug)}`,
      lastModified: p.updated ?? p.published,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [...staticPages, ...blogPages()];
}
