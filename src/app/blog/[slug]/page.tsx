import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { H2, H3, P } from "@/features/blog/components/prose";
import { jsonLdScript, postJsonLd } from "@/features/blog/json-ld";
import { POSTS, bannerPath, formatPostDate, getPost, ogImagePath, postPath, relatedPosts } from "@/features/blog/posts";
import { TRIAL_DAYS } from "@/lib/billing";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

/** Every post is rendered at build time; unknown slugs are a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const image = { url: ogImagePath(post.slug), width: 1200, height: 630, alt: post.h1 };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: postPath(post.slug) },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: postPath(post.slug),
      siteName: SITE_NAME,
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [image.url] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const { Body } = post;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(postJsonLd(post)) }} />

      <article className="mx-auto w-full max-w-[740px] px-4 pt-4 pb-16 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[14px] text-ink-soft">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink hover:underline">Home</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/blog" className="hover:text-ink hover:underline">Blog</Link>
            </li>
          </ol>
        </nav>

        <header className="mt-6">
          <div className="flex items-center gap-3 text-[15px] text-ink-soft">
            <LogoMark size={30} level={post.mood} />
            <time dateTime={post.published}>{formatPostDate(post.published)}</time>
            <span aria-hidden>·</span>
            <span>{post.readMinutes} min read</span>
          </div>
          <h1 className="mt-4 font-display text-[38px] leading-[1.05] font-extrabold tracking-[-0.02em] sm:text-[52px]">{post.h1}</h1>
        </header>

        {/* eslint-disable-next-line @next/next/no-img-element -- a static, pre-sized WebP; no resizing service needed */}
        <img
          src={bannerPath(post.slug)}
          alt={post.bannerAlt}
          width={1600}
          height={800}
          fetchPriority="high"
          decoding="async"
          className="mt-7 aspect-[2/1] h-auto w-full rounded-3xl border-2 border-outline shadow-[4px_4px_0_var(--outline)]"
        />

        <div className="mt-4">
          <Body />
        </div>

        <section aria-labelledby="faq" className="mt-4">
          <H2 id="faq">FAQ</H2>
          {post.faq.map((f) => (
            <div key={f.q}>
              <H3>{f.q}</H3>
              <P className="mt-2">{f.a}</P>
            </div>
          ))}
        </section>

        <aside className="ink-hero mt-14 px-6 py-8 sm:px-10">
          <div className="relative z-[2] flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-[26px] leading-tight font-extrabold uppercase">
                Which way is <span className="text-mood-500">your day</span> going?
              </p>
              <p className="mt-2 text-[16px] text-cream/75">{TRIAL_DAYS} days free · no card needed</p>
            </div>
            <Link href="/sign-up" className={buttonClass("primary", "lg", "btn-pop shrink-0 !border-cream")}>
              Try Rumbodia free <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </aside>

        <section aria-labelledby="keep-reading" className="mt-14">
          <h2 id="keep-reading" className="font-display text-[24px] font-extrabold">Keep reading</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedPosts(post.slug).map((r) => (
              <li key={r.slug}>
                <Link href={postPath(r.slug)} className="lift flex h-full gap-4 rounded-2xl border border-line bg-card p-5">
                  <LogoMark size={36} level={r.mood} />
                  <span>
                    <span className="block font-display text-[18px] leading-snug font-bold">{r.h1}</span>
                    <span className="mt-1 block text-[14px] text-ink-soft">{r.readMinutes} min read</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
