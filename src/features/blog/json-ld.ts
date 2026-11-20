import { BLOG_AUTHOR, bannerPath, ogImagePath, postPath } from "@/features/blog/posts";
import type { Post } from "@/features/blog/types";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Article + FAQ + breadcrumbs for one post, as one JSON-LD graph. */
export function postJsonLd(post: Post) {
  const url = `${SITE_URL}${postPath(post.slug)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.h1,
        description: post.description,
        image: [`${SITE_URL}${bannerPath(post.slug)}`, `${SITE_URL}${ogImagePath(post.slug)}`],
        datePublished: post.published,
        dateModified: post.updated ?? post.published,
        author: BLOG_AUTHOR,
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` },
        },
        mainEntityOfPage: url,
        inLanguage: "en",
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: post.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.h1, item: url },
        ],
      },
    ],
  };
}

/** Safe to put inside <script>: no "</script>" can break out (see Next's JSON-LD guide). */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
