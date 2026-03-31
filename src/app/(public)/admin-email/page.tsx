"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminEmailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "manual">("paste");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    address?: string;
    method?: string;
    confidence?: number;
    message?: string;
    error?: string;
    extracted?: Record<string, unknown>;
    listingId?: string;
  } | null>(null);

  // Redirect non-admin
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  async function handlePasteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const form = e.currentTarget;
    const data = {
      from: (form.elements.namedItem("from") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      body: (form.elements.namedItem("body") as HTMLTextAreaElement).value,
      receivedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/ingest/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ error: String(err) });
    }
    setSending(false);
  }

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const form = e.currentTarget;
    // Build a synthetic email body from the manual fields
    const address = (form.elements.namedItem("address") as HTMLInputElement).value;
    const city = (form.elements.namedItem("city") as HTMLInputElement).value;
    const price = (form.elements.namedItem("price") as HTMLInputElement).value;
    const beds = (form.elements.namedItem("beds") as HTMLInputElement).value;
    const baths = (form.elements.namedItem("baths") as HTMLInputElement).value;
    const sqft = (form.elements.namedItem("sqft") as HTMLInputElement).value;
    const agentName = (form.elements.namedItem("agentName") as HTMLInputElement).value;
    const agentPhone = (form.elements.namedItem("agentPhone") as HTMLInputElement).value;
    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement).value;

    const body = `Pocket listing at ${address}, ${city}, TX. Asking $${price}. ${beds} bed / ${baths} bath, ${sqft} sqft. Contact ${agentName} at ${agentPhone}. ${notes}`;

    try {
      const res = await fetch("/api/ingest/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: agentName || "Manual Entry",
          subject: `Pocket Listing: ${address}`,
          body,
          receivedAt: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ error: String(err) });
    }
    setSending(false);
  }

  if (status === "loading") return null;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-warm-gray">
      <div className="max-w-[800px] mx-auto px-6">
        <h1 className="text-3xl font-light text-navy mb-2">
          Add <span className="font-semibold">Pocket Listing</span>
        </h1>
        <p className="text-mid-gray text-sm mb-8">
          Paste a forwarded email or manually enter a listing you heard about.
          The system will extract and ingest it into SuperSearch.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-0 mb-8">
          {(["paste", "manual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); }}
              className={`px-6 py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                mode === m ? "bg-navy text-white" : "bg-white text-mid-gray hover:text-navy"
              }`}
            >
              {m === "paste" ? "Paste Email" : "Manual Entry"}
            </button>
          ))}
        </div>

        {mode === "paste" ? (
          <form onSubmit={handlePasteSubmit} className="bg-white p-8 space-y-5">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                From (Agent Name or Email)
              </label>
              <input
                name="from"
                type="text"
                placeholder="Jane Smith or jane@kw.com"
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                Subject Line
              </label>
              <input
                name="subject"
                type="text"
                placeholder="Coming Soon - 123 Main St"
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                Email Body (paste the full email text)
              </label>
              <textarea
                name="body"
                rows={12}
                required
                placeholder="Paste the email content here. The system will automatically extract the address, price, beds, baths, sqft, and agent contact info..."
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold resize-none font-mono"
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full disabled:opacity-50">
              {sending ? "Parsing..." : "Parse & Ingest"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleManualSubmit} className="bg-white p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Property Address
                </label>
                <input
                  name="address"
                  type="text"
                  required
                  placeholder="123 Main St"
                  className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  City
                </label>
                <input
                  name="city"
                  type="text"
                  required
                  defaultValue="Austin"
                  className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Asking Price
                </label>
                <input
                  name="price"
                  type="text"
                  placeholder="650000"
                  className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Beds
                </label>
                <input name="beds" type="number" placeholder="3" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Baths
                </label>
                <input name="baths" type="number" step="0.5" placeholder="2" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Sq Ft
                </label>
                <input name="sqft" type="number" placeholder="1800" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Agent Name
                </label>
                <input name="agentName" type="text" placeholder="Jane Smith" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Agent Phone
                </label>
                <input name="agentPhone" type="tel" placeholder="512-555-1234" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Any additional details (updated kitchen, pool, corner lot, etc.)"
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold resize-none"
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full disabled:opacity-50">
              {sending ? "Adding..." : "Add to SuperSearch"}
            </button>
          </form>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-6 p-6 ${result.success ? "bg-gold/10 border border-gold/30" : "bg-red-50 border border-red-200"}`}>
            {result.success ? (
              <div>
                <p className="text-navy font-semibold mb-2">Listing Ingested</p>
                <p className="text-sm text-mid-gray">
                  <strong>{result.address}</strong> added to SuperSearch.
                </p>
                <p className="text-sm text-mid-gray mt-1">
                  Method: {result.method} | Confidence: {Math.round((result.confidence ?? 0) * 100)}%
                </p>
                {result.extracted && (
                  <details className="mt-3">
                    <summary className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold cursor-pointer">
                      View Extracted Data
                    </summary>
                    <pre className="mt-2 text-[11px] text-mid-gray overflow-x-auto">
                      {JSON.stringify(result.extracted, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div>
                <p className="text-red-600 font-semibold mb-1">Could Not Extract Listing</p>
                <p className="text-sm text-mid-gray">{result.message || result.error || "Unknown error"}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
