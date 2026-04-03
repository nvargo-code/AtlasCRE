import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RevealSection } from "@/components/public/RevealSection";
import { BLOG_ARTICLES } from "@/data/blog-articles";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Article Not Found | Shapiro Group" };
  return {
    title: `${article.title} | Shapiro Group`,
    description: article.excerpt,
  };
}

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

/**
 * Simple markdown-ish renderer:
 * - **bold** → <strong>
 * - Lines starting with # → headers
 * - Empty lines → paragraph breaks
 * - Lines starting with - → list items
 */
function renderContent(content: string) {
  const paragraphs = content.split("\n\n");

  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Header
    if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.slice(2, -2).includes("\n")) {
      const text = trimmed.slice(2, -2);
      return (
        <h3 key={i} className="text-xl font-semibold text-navy mt-10 mb-4">
          {text}
        </h3>
      );
    }

    // List (lines starting with -)
    if (trimmed.split("\n").every((line) => line.trim().startsWith("- ") || line.trim() === "")) {
      const items = trimmed.split("\n").filter((line) => line.trim().startsWith("- "));
      return (
        <ul key={i} className="list-disc list-outside ml-6 space-y-2 mb-6 text-mid-gray text-[15px] leading-relaxed">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: formatBold(item.trim().slice(2)) }} />
          ))}
        </ul>
      );
    }

    // Numbered list
    if (trimmed.split("\n").every((line) => /^\d+\./.test(line.trim()) || line.trim() === "")) {
      const items = trimmed.split("\n").filter((line) => /^\d+\./.test(line.trim()));
      return (
        <ol key={i} className="list-decimal list-outside ml-6 space-y-2 mb-6 text-mid-gray text-[15px] leading-relaxed">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: formatBold(item.trim().replace(/^\d+\.\s*/, "")) }} />
          ))}
        </ol>
      );
    }

    // Regular paragraph
    return (
      <p
        key={i}
        className="text-mid-gray text-[15px] leading-relaxed mb-6"
        dangerouslySetInnerHTML={{ __html: formatBold(trimmed.replace(/\n/g, "<br/>")) }}
      />
    );
  });
}

function formatBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-navy font-semibold">$1</strong>');
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) notFound();

  const relatedArticles = BLOG_ARTICLES.filter(
    (a) => a.slug !== slug && (a.category === article.category || Math.random() > 0.5)
  ).slice(0, 3);

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            author: { "@type": "Person", name: article.author },
            publisher: { "@type": "Organization", name: "Shapiro Group" },
            datePublished: article.date,
          }),
        }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 bg-navy">
        <div className="max-w-[800px] mx-auto px-6 md:px-10">
          <Link
            href="/blog"
            className="text-gold text-[12px] font-semibold tracking-[0.2em] uppercase hover:text-gold-dark transition-colors mb-6 inline-block"
          >
            &larr; All Articles
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold bg-gold/10 px-3 py-1">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-light text-white leading-tight mb-6">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-white/40 text-sm">
            <span>By {article.author}</span>
            <span>&middot;</span>
            <span>{article.date}</span>
            <span>&middot;</span>
            <span>{article.readTime} read</span>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 md:py-20">
        <div className="max-w-[720px] mx-auto px-6 md:px-10">
          {/* Excerpt / lead */}
          <p className="text-lg text-navy font-light leading-relaxed mb-10 border-l-2 border-gold pl-6">
            {article.excerpt}
          </p>

          {/* Body */}
          <div>{renderContent(article.content)}</div>
        </div>
      </section>

      {/* Author Card */}
      <RevealSection className="py-12 bg-warm-gray">
        <div className="max-w-[720px] mx-auto px-6 md:px-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-lg">
              {article.author[0]}
            </div>
            <div>
              <p className="font-semibold text-navy">{article.author}</p>
              <p className="text-mid-gray text-sm">Shapiro Group</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <h2 className="text-2xl font-light text-navy mb-8 text-center">
              More <span className="font-semibold">Insights</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group border border-navy/10 hover:border-gold/30 transition-all p-6"
                >
                  <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-gold">
                    {related.category}
                  </span>
                  <h3 className="text-base font-semibold text-navy group-hover:text-gold transition-colors mt-2 mb-2 leading-tight">
                    {related.title}
                  </h3>
                  <p className="text-sm text-mid-gray line-clamp-2">{related.excerpt}</p>
                  <p className="text-[11px] text-mid-gray mt-3">{related.date} &middot; {related.readTime}</p>
                </Link>
              ))}
            </div>
          </div>
        </RevealSection>
      )}

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Ready to <span className="font-semibold">Take Action?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Whether you&apos;re buying, selling, or investing — we have the data and
            expertise to help you make the right move.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="btn-primary">Search with SuperSearch</Link>
            <Link href="/contact" className="btn-outline">Talk to Us</Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
