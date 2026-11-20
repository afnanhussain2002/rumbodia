import type { MarkLevel } from "@/components/brand/mark";

export interface Faq {
  q: string;
  a: string;
}

export interface Post {
  /** URL: /blog/{slug}. Never change after publishing (it breaks links and rankings). */
  slug: string;
  /** <title> tag, under 60 characters. The layout adds " | Rumbodia". */
  title: string;
  /** The H1 on the page. */
  h1: string;
  /** Meta description, under 155 characters. */
  description: string;
  /** The one search phrase this post targets (for reference; not output as meta keywords). */
  keyword: string;
  /** ISO date (YYYY-MM-DD). */
  published: string;
  /** ISO date of the last real content change. */
  updated?: string;
  /** Rumbo's face on the card and share image. */
  mood: MarkLevel;
  readMinutes: number;
  /** Describes the hero banner (public/blog/banners/{slug}.webp) for screen readers and image search. */
  bannerAlt: string;
  faq: Faq[];
  /** The article body, between the intro header and the FAQ. */
  Body: () => React.ReactElement;
}
