import type { Post } from "@/features/blog/types";
import { post as daysImproving } from "@/features/blog/posts/how-to-know-if-your-days-are-improving";
import { post as gta6 } from "@/features/blog/posts/play-gta-6-without-losing-your-week";
import { post as journalingFails } from "@/features/blog/posts/why-journaling-fails";
import { post as trackProgress } from "@/features/blog/posts/track-daily-progress-against-goals";

/**
 * Every published post. To add one: create a file next to these, export `post`, add it here,
 * and add its banner (public/blog/banners/{slug}.webp) and 1200×630 share image (public/blog/og/{slug}.png). The blog index, sitemap, metadata,
 * JSON-LD and "Keep reading" links all come from this list.
 */
export const POSTS: readonly Post[] = [gta6, daysImproving, journalingFails, trackProgress];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** The other posts, for "Keep reading". */
export function relatedPosts(slug: string): Post[] {
  return POSTS.filter((p) => p.slug !== slug);
}

/** 2:1 hero banner shown at the top of the post (1600×800). */
export const bannerPath = (slug: string) => `/blog/banners/${slug}.webp`;

/** 1200×630 share image (Open Graph / X). */
export const ogImagePath = (slug: string) => `/blog/og/${slug}.png`;

export const postPath = (slug: string) => `/blog/${slug}`;

/** Shown as the author in search results. Switch to a person (with a profile URL) if you want a byline. */
export const BLOG_AUTHOR = { "@type": "Organization", name: "Rumbodia" } as const;

/** "November 18, 2026" in a fixed locale and zone, so server and build agree. */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
