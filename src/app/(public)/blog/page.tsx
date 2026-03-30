import Link from "next/link";
import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Market Updates & Insights | Shapiro Group",
  description:
    "Fact-based research, real-time statistics, and thoughtful analysis on how the economy impacts Austin real estate. Market updates from the Shapiro Group.",
};

// Placeholder articles — will be replaced with CMS/markdown content later
const articles = [
  {
    slug: "austin-market-q1-2026",
    title: "Austin Real Estate Market Update: Q1 2026",
    excerpt:
      "Inventory levels, median prices, and days on market — what the numbers tell us about Austin's housing market heading into spring.",
    category: "Market Update",
    date: "March 2026",
    readTime: "5 min",
  },
  {
    slug: "why-supersearch-matters",
    title: "Why SuperSearch Finds More Listings Than Zillow",
    excerpt:
      "How our proprietary search engine aggregates data from MLS, off-market databases, and broker networks to surface properties you won't find elsewhere.",
    category: "Technology",
    date: "March 2026",
    readTime: "3 min",
  },
  {
    slug: "first-time-buyer-guide-austin",
    title: "First-Time Buyer's Guide to Austin in 2026",
    excerpt:
      "From pre-approval to closing, everything you need to know about buying your first home in Austin. Neighborhoods, budgets, and common mistakes.",
    category: "Guides",
    date: "February 2026",
    readTime: "8 min",
  },
  {
    slug: "investment-properties-austin",
    title: "Best Neighborhoods for Investment Properties in Austin",
    excerpt:
      "Cap rates, appreciation trends, and rental demand — our data-driven analysis of Austin's top neighborhoods for real estate investors.",
    category: "Investment",
    date: "February 2026",
    readTime: "6 min",
  },
  {
    slug: "selling-in-competitive-market",
    title: "How to Sell Above Asking in a Competitive Market",
    excerpt:
      "Pricing strategy, staging tips, and marketing tactics that consistently drive multiple offers and above-asking sales.",
    category: "Selling",
    date: "January 2026",
    readTime: "4 min",
  },
  {
    slug: "78704-neighborhood-deep-dive",
    title: "78704: Austin's Most Sought-After ZIP Code",
    excerpt:
      "Why South Austin's 78704 remains one of the hottest markets in Texas — school ratings, walkability, and what buyers love about the area.",
    category: "Neighborhoods",
    date: "January 2026",
    readTime: "5 min",
  },
];

const categories = [
  "All",
  "Market Update",
  "Technology",
  "Guides",
  "Investment",
  "Selling",
  "Neighborhoods",
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Insights
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Market Updates <br />
            <span className="font-semibold">& Analysis</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-lg mt-6">
            Fact-based research, real-time statistics, and thoughtful analysis
            on Austin real estate.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <div className="bg-white border-b border-navy/10 sticky top-20 z-30">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex gap-6 overflow-x-auto py-4">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`text-[12px] font-semibold tracking-[0.1em] uppercase whitespace-nowrap transition-colors ${
                  cat === "All"
                    ? "text-gold"
                    : "text-mid-gray hover:text-navy"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article
                key={article.slug}
                className="group border border-navy/10 hover:border-gold/30 transition-all duration-300"
              >
                {/* Placeholder image area */}
                <div className="aspect-[16/9] bg-navy/5 flex items-center justify-center">
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold bg-gold/10 px-3 py-1.5">
                    {article.category}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[11px] text-mid-gray">{article.date}</span>
                    <span className="text-navy/10">&middot;</span>
                    <span className="text-[11px] text-mid-gray">{article.readTime} read</span>
                  </div>

                  <h2 className="text-lg font-semibold text-navy group-hover:text-gold transition-colors mb-3 leading-tight">
                    {article.title}
                  </h2>

                  <p className="text-sm text-mid-gray leading-relaxed mb-4">
                    {article.excerpt}
                  </p>

                  <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-navy/40 group-hover:text-gold transition-colors">
                    Coming Soon &rarr;
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Newsletter CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            Never Miss an <span className="font-semibold">Update</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-8">
            Get monthly market analysis, new listing alerts, and exclusive
            insights delivered to your inbox.
          </p>
          <form className="flex gap-0 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-white/5 border border-white/20 px-5 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
            />
            <button
              type="submit"
              className="bg-gold text-white px-8 py-3.5 text-[12px] font-semibold tracking-[0.12em] uppercase hover:bg-gold-dark transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </RevealSection>
    </>
  );
}
