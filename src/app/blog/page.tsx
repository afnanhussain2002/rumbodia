import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { jsonLdScript } from "@/features/blog/json-ld";
import { POSTS, formatPostDate, postPath } from "@/features/blog/posts";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Blog: Daily Progress, Goals and Better Days";
const DESCRIPTION = "Short, research-backed guides on tracking daily progress, reaching your goals and seeing whether your days are getting better.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/blog", siteName: SITE_NAME },
};

export default function BlogIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} Blog`,
    url: `${SITE_URL}/blog`,
    description: DESCRIPTION,
    blogPost: POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.h1,
      url: `${SITE_URL}${postPath(p.slug)}`,
      datePublished: p.published,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-[920px] px-4 pt-6 pb-20 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <h1 className="font-display text-[44px] leading-none font-extrabold tracking-[-0.02em] sm:text-[56px]">The Rumbodia blog</h1>
      <p className="mt-4 max-w-[600px] text-[18px] leading-relaxed text-ink-soft">{DESCRIPTION}</p>

      <ul className="mt-10 grid gap-5">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link href={postPath(p.slug)} className="lift flex gap-5 rounded-3xl border border-line bg-card p-6 sm:p-7">
              <LogoMark size={52} level={p.mood} className="mt-1" />
              <span className="min-w-0">
                <span className="block text-[14px] text-ink-soft">
                  <time dateTime={p.published}>{formatPostDate(p.published)}</time> · {p.readMinutes} min read
                </span>
                <span className="mt-1 block font-display text-[24px] leading-tight font-extrabold sm:text-[28px]">{p.h1}</span>
                <span className="mt-2 block text-[16px] leading-relaxed text-ink-soft">{p.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
