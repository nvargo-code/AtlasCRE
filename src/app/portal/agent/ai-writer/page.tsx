"use client";

import { useState } from "react";

type ContentType = "listing_description" | "social_post" | "email_campaign" | "market_update" | "follow_up";

const CONTENT_TYPES: { key: ContentType; label: string; description: string }[] = [
  { key: "listing_description", label: "Listing Description", description: "MLS-ready property descriptions" },
  { key: "social_post", label: "Social Post", description: "Instagram/Facebook content with hashtags" },
  { key: "email_campaign", label: "Email Campaign", description: "Subject lines and email body copy" },
  { key: "market_update", label: "Market Update", description: "Neighborhood market summaries" },
  { key: "follow_up", label: "Follow-Up", description: "Personalized client messages" },
];

interface FormFields {
  [key: string]: { label: string; placeholder: string; type?: string };
}

const FORM_CONFIGS: Record<ContentType, FormFields> = {
  listing_description: {
    address: { label: "Address", placeholder: "123 Main St" },
    neighborhood: { label: "Neighborhood", placeholder: "South Austin / 78704" },
    price: { label: "Price", placeholder: "$550,000" },
    beds: { label: "Beds", placeholder: "3" },
    baths: { label: "Baths", placeholder: "2" },
    sqft: { label: "Sqft", placeholder: "2,000" },
    yearBuilt: { label: "Year Built", placeholder: "2005" },
    propertyType: { label: "Property Type", placeholder: "Single Family" },
    features: { label: "Key Features", placeholder: "Updated kitchen, pool, large backyard, smart home..." },
    notes: { label: "Additional Notes", placeholder: "Recently renovated, quiet cul-de-sac, great schools nearby..." },
  },
  social_post: {
    postType: { label: "Post Type", placeholder: "New Listing / Just Sold / Open House / Price Reduction" },
    address: { label: "Property", placeholder: "123 Main St" },
    neighborhood: { label: "Neighborhood", placeholder: "South Austin" },
    price: { label: "Price", placeholder: "$550,000" },
    beds: { label: "Beds", placeholder: "3" },
    baths: { label: "Baths", placeholder: "2" },
    sqft: { label: "Sqft", placeholder: "2,000" },
    highlight: { label: "Key Highlight", placeholder: "The backyard oasis with a heated pool..." },
    notes: { label: "Additional Context", placeholder: "Open house this Sunday 1-4pm..." },
  },
  email_campaign: {
    purpose: { label: "Purpose", placeholder: "New listing announcement / Just sold / Open house invite" },
    audience: { label: "Target Audience", placeholder: "Active buyers in 78704" },
    subject: { label: "Property/Topic", placeholder: "New listing at 123 Main St" },
    details: { label: "Key Details", placeholder: "3BR/2BA, $550K, updated kitchen, pool..." },
    cta: { label: "Call to Action", placeholder: "Schedule a showing" },
    notes: { label: "Additional Context", placeholder: "" },
  },
  market_update: {
    area: { label: "Area", placeholder: "78704 / South Austin / Downtown" },
    dataPoints: { label: "Data Points", placeholder: "Median price up 3%, inventory down 15%, avg DOM 28 days" },
    timeframe: { label: "Timeframe", placeholder: "March 2026" },
    audience: { label: "Audience", placeholder: "Buyers and sellers" },
    takeaway: { label: "Key Takeaway", placeholder: "It's still a seller's market but showing signs of cooling" },
    notes: { label: "Additional Context", placeholder: "" },
  },
  follow_up: {
    format: { label: "Format", placeholder: "text or email" },
    clientName: { label: "Client Name", placeholder: "John" },
    context: { label: "Context", placeholder: "After showing 3 homes in Westlake yesterday" },
    properties: { label: "Properties Viewed", placeholder: "123 Oak Dr, 456 Elm St, 789 Pine Ave" },
    preferences: { label: "Client Preferences", placeholder: "Wants 4BR, big yard, under $800K, good schools" },
    nextStep: { label: "Suggested Next Step", placeholder: "New listing coming on market Thursday" },
    notes: { label: "Additional Context", placeholder: "They loved the kitchen at 123 Oak Dr" },
  },
};

export default function AIWriterPage() {
  const [contentType, setContentType] = useState<ContentType>("listing_description");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function updateField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function switchType(type: ContentType) {
    setContentType(type);
    setFields({});
    setResult("");
  }

  async function generate() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/portal/ai-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: contentType, details: fields }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.content);
      } else {
        const err = await res.json();
        setResult(`Error: ${err.error || "Failed to generate content"}`);
      }
    } catch {
      setResult("Error: Failed to connect to AI service");
    }
    setLoading(false);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const formConfig = FORM_CONFIGS[contentType];

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Atlas AI</p>
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          AI Content <span className="font-semibold">Writer</span>
        </h1>
        <p className="text-mid-gray text-sm mt-2">
          Generate listing descriptions, social posts, emails, and more with AI.
        </p>
      </div>

      {/* Content Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CONTENT_TYPES.map((ct) => (
          <button
            key={ct.key}
            onClick={() => switchType(ct.key)}
            className={`px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
              contentType === ct.key
                ? "bg-navy text-white"
                : "bg-white border border-navy/10 text-navy/50 hover:text-navy"
            }`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white border border-navy/10 p-6">
          <h2 className="text-sm font-semibold text-navy mb-1 tracking-wide uppercase">
            {CONTENT_TYPES.find((ct) => ct.key === contentType)?.label}
          </h2>
          <p className="text-[11px] text-mid-gray mb-4">
            {CONTENT_TYPES.find((ct) => ct.key === contentType)?.description}
          </p>

          <div className="space-y-3">
            {Object.entries(formConfig).map(([key, config]) => (
              <div key={key}>
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">
                  {config.label}
                </label>
                {key === "features" || key === "notes" || key === "details" || key === "context" || key === "dataPoints" ? (
                  <textarea
                    value={fields[key] || ""}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder={config.placeholder}
                    rows={3}
                    className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors resize-none"
                  />
                ) : (
                  <input
                    type={config.type || "text"}
                    value={fields[key] || ""}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="mt-6 w-full bg-navy text-white py-3 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate with AI"
            )}
          </button>
        </div>

        {/* Output */}
        <div className="bg-white border border-navy/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy tracking-wide uppercase">Generated Content</h2>
            {result && (
              <button
                onClick={copyToClipboard}
                className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-mid-gray text-sm">Atlas AI is writing...</p>
              </div>
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none">
              <div className="bg-warm-gray p-5 text-sm text-navy leading-relaxed whitespace-pre-wrap font-mono">
                {result}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={generate}
                  className="text-[11px] font-semibold tracking-[0.1em] uppercase text-navy/40 hover:text-navy transition-colors px-3 py-1.5 border border-navy/10"
                >
                  Regenerate
                </button>
                <button
                  onClick={copyToClipboard}
                  className="text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-gold hover:bg-gold-dark transition-colors px-3 py-1.5"
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20 text-center">
              <div>
                <svg className="w-10 h-10 text-navy/10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-mid-gray text-sm">Fill in the details and click Generate</p>
                <p className="text-[11px] text-mid-gray mt-1">Powered by Claude AI</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
