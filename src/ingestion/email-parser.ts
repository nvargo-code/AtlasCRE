/**
 * Email Parser for Pocket Listings
 *
 * Parses forwarded emails from agents containing off-market/pocket listing
 * announcements. Extracts structured listing data using pattern matching
 * and optional AI-powered extraction.
 *
 * Supported email sources:
 * - Direct forwards from agents (plain text / HTML)
 * - Broker blast emails
 * - Coming soon announcements
 * - Pocket listing networks
 *
 * Flow:
 * 1. Receive raw email body (text or HTML)
 * 2. Strip HTML to plain text
 * 3. Extract structured fields via regex patterns
 * 4. Optionally enhance with AI (Claude API) for complex emails
 * 5. Geocode the address
 * 6. Return NormalizedListing ready for ingestion
 */

import { NormalizedListing } from "./types";

export interface ParsedEmail {
  from: string;
  subject: string;
  body: string;
  html?: string;
  receivedAt: string;
}

export interface ExtractedListing {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  listingType?: string;
  description?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentCompany?: string;
  imageUrls?: string[];
  confidence: number; // 0-1, how confident we are in the extraction
}

// ── HTML stripping ──────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " | ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Pattern-based extraction ────────────────────────────────────────────────

const ADDRESS_PATTERNS = [
  // "123 Main St, Austin, TX 78704"
  /(\d{1,6}\s+[\w\s.]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Cir|Circle|Pl|Place|Pkwy|Parkway|Trl|Trail)\.?)\s*,?\s*([\w\s]+),?\s*(TX|Texas)\s*(\d{5})?/i,
  // "Address: 123 Main St"
  /(?:address|location|property)\s*[:]\s*(\d{1,6}\s+[\w\s.]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Cir|Circle|Pl|Place|Pkwy|Parkway|Trl|Trail)\.?)/i,
];

const PRICE_PATTERNS = [
  // "$1,250,000" or "$1.25M" or "Asking $850K"
  /(?:price|asking|list|offered at|priced at)?\s*\$\s*([\d,]+(?:\.\d+)?)\s*(?:M|million)/i,
  /(?:price|asking|list|offered at|priced at)?\s*\$\s*([\d,]+(?:\.\d+)?)\s*(?:K|thousand)/i,
  /(?:price|asking|list|offered at|priced at)?\s*\$\s*([\d,]+(?:\.\d+)?)/i,
];

const BEDS_PATTERNS = [
  /(\d+)\s*(?:bed|bedroom|br|bd)/i,
  /(?:bed|bedroom|br|bd)\s*[:]\s*(\d+)/i,
  /(\d+)\s*\/\s*\d+/,  // "3/2" format (beds/baths)
];

const BATHS_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba)\b/i,
  /(?:bath|bathroom|ba)\s*[:]\s*(\d+(?:\.\d+)?)/i,
  /\d+\s*\/\s*(\d+(?:\.\d+)?)/,  // "3/2" format
];

const SQFT_PATTERNS = [
  /([\d,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet|sf)\b/i,
  /(?:sq\.?\s*ft|sqft|square\s*feet|sf)\s*[:]\s*([\d,]+)/i,
  /([\d,]+)\s*(?:living|heated)\s*(?:sq|sf)/i,
];

const YEAR_BUILT_PATTERNS = [
  /(?:built|year built|constructed|yr blt)\s*(?:in\s*)?[:]\s*(\d{4})/i,
  /(?:built|year built|constructed)\s+(?:in\s+)?(\d{4})/i,
];

const PHONE_PATTERNS = [
  /(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/,
  /(\d{3}[\s.-]\d{3}[\s.-]\d{4})/,
];

const EMAIL_PATTERNS = [
  /([\w.+-]+@[\w-]+\.[\w.]+)/,
];

const LOT_PATTERNS = [
  /([\d.]+)\s*(?:acre|ac)\b/i,
  /(?:lot|land)\s*(?:size)?\s*[:]\s*([\d.]+)\s*(?:acre|ac)/i,
];

const PROPERTY_TYPE_KEYWORDS: Record<string, string[]> = {
  "Single Family": ["single family", "sfr", "detached", "house", "home"],
  "Condo": ["condo", "condominium", "unit"],
  "Townhouse": ["townhouse", "townhome", "town home"],
  "Multi-Family": ["multi-family", "multifamily", "duplex", "triplex", "fourplex", "4-plex"],
  "Land": ["lot", "land", "acreage", "vacant"],
  "Farm/Ranch": ["farm", "ranch", "agricultural"],
};

const LISTING_TYPE_KEYWORDS: Record<string, string[]> = {
  "Sale": ["for sale", "asking", "offered at", "priced at", "buy", "purchase", "listing price"],
  "Lease": ["for lease", "for rent", "rental", "per month", "/mo", "lease rate"],
};

function extractWithPatterns(text: string): ExtractedListing {
  const result: ExtractedListing = { confidence: 0 };
  let matchCount = 0;

  // Address
  for (const pattern of ADDRESS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      result.address = match[1]?.trim();
      if (match[2]) result.city = match[2]?.trim();
      if (match[3]) result.state = match[3] === "Texas" ? "TX" : match[3];
      if (match[4]) result.zip = match[4];
      matchCount += 3;
      break;
    }
  }

  // Price
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let val = parseFloat(match[1].replace(/,/g, ""));
      if (text.match(pattern)![0].toLowerCase().includes("m") || text.match(pattern)![0].toLowerCase().includes("million")) {
        val *= 1_000_000;
      } else if (text.match(pattern)![0].toLowerCase().includes("k") || text.match(pattern)![0].toLowerCase().includes("thousand")) {
        val *= 1_000;
      }
      result.price = val;
      matchCount++;
      break;
    }
  }

  // Beds
  for (const pattern of BEDS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      result.beds = parseInt(match[1]);
      matchCount++;
      break;
    }
  }

  // Baths
  for (const pattern of BATHS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      result.baths = parseFloat(match[1]);
      matchCount++;
      break;
    }
  }

  // Sqft
  for (const pattern of SQFT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      result.sqft = parseInt(match[1].replace(/,/g, ""));
      matchCount++;
      break;
    }
  }

  // Year built
  for (const pattern of YEAR_BUILT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const yr = parseInt(match[1]);
      if (yr >= 1800 && yr <= 2030) {
        result.yearBuilt = yr;
        matchCount++;
      }
      break;
    }
  }

  // Lot size
  for (const pattern of LOT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      result.lotSize = parseFloat(match[1]);
      matchCount++;
      break;
    }
  }

  // Property type
  const lowerText = text.toLowerCase();
  for (const [type, keywords] of Object.entries(PROPERTY_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      result.propertyType = type;
      matchCount++;
      break;
    }
  }

  // Listing type
  for (const [type, keywords] of Object.entries(LISTING_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      result.listingType = type;
      matchCount++;
      break;
    }
  }

  // Agent contact info
  const phoneMatch = text.match(PHONE_PATTERNS[0]);
  if (phoneMatch) result.agentPhone = phoneMatch[1];

  const emailMatch = text.match(EMAIL_PATTERNS[0]);
  if (emailMatch) result.agentEmail = emailMatch[1];

  // Extract a short description (first 2-3 sentences that look like a description)
  const sentences = text.split(/[.!]\s+/).filter((s) => s.length > 30 && s.length < 500);
  if (sentences.length > 0) {
    result.description = sentences.slice(0, 3).join(". ").trim();
    if (!result.description.endsWith(".")) result.description += ".";
  }

  // Confidence score (0-1)
  const maxFields = 8; // address, price, beds, baths, sqft, type, listingType, yearBuilt
  result.confidence = Math.min(matchCount / maxFields, 1);

  return result;
}

// ── AI-powered extraction (optional) ────────────────────────────────────────

async function extractWithAI(text: string): Promise<ExtractedListing | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Extract real estate listing details from this email. Return ONLY valid JSON, no other text.

Email:
${text.slice(0, 3000)}

Return this exact JSON structure (use null for unknown fields):
{
  "address": "street address",
  "city": "city name",
  "state": "TX",
  "zip": "zip code",
  "price": number or null,
  "beds": number or null,
  "baths": number or null,
  "sqft": number or null,
  "lotSize": number or null (in acres),
  "yearBuilt": number or null,
  "propertyType": "Single Family" | "Condo" | "Townhouse" | "Multi-Family" | "Land" | null,
  "listingType": "Sale" | "Lease" | null,
  "description": "brief description" or null,
  "agentName": "agent name" or null,
  "agentPhone": "phone" or null,
  "agentEmail": "email" or null,
  "agentCompany": "brokerage" or null
}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.content?.[0]?.text;
    if (!content) return null;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, confidence: 0.9 };
  } catch (e) {
    console.warn("[email-parser] AI extraction failed:", e);
    return null;
  }
}

// ── Geocoding ───────────────────────────────────────────────────────────────

async function geocode(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${address}, ${city}, ${state}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "User-Agent": "AtlasCRE/1.0" }, signal: AbortSignal.timeout(5000) }
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ── Main export ─────────────────────────────────────────────────────────────

export async function parseEmailToListing(email: ParsedEmail): Promise<{
  listing: NormalizedListing | null;
  extracted: ExtractedListing;
  method: "pattern" | "ai" | "hybrid";
}> {
  const plainText = email.html ? stripHtml(email.html) : email.body;
  const fullText = `Subject: ${email.subject}\n\n${plainText}`;

  // First try pattern matching
  let extracted = extractWithPatterns(fullText);
  let method: "pattern" | "ai" | "hybrid" = "pattern";

  // If low confidence, try AI extraction
  if (extracted.confidence < 0.5) {
    const aiResult = await extractWithAI(fullText);
    if (aiResult && (aiResult.confidence ?? 0) > extracted.confidence) {
      extracted = { ...extracted, ...aiResult, confidence: aiResult.confidence ?? 0.9 };
      method = "ai";
    }
  } else if (extracted.confidence < 0.8) {
    // Hybrid: use AI to fill in gaps
    const aiResult = await extractWithAI(fullText);
    if (aiResult) {
      const ext = extracted as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(aiResult)) {
        if (value != null && ext[key] == null) {
          ext[key] = value;
        }
      }
      method = "hybrid";
    }
  }

  // Need at least an address to create a listing
  if (!extracted.address) {
    return { listing: null, extracted, method };
  }

  const city = extracted.city || "Austin";
  const state = extracted.state || "TX";

  // Geocode
  const geo = await geocode(extracted.address, city, state);
  if (!geo) {
    return { listing: null, extracted, method };
  }

  // Determine market from city
  const austinCities = ["austin", "round rock", "cedar park", "georgetown", "pflugerville", "kyle", "buda", "manor", "leander", "lakeway", "bee cave", "dripping springs", "westlake"];
  const market = austinCities.some((c) => city.toLowerCase().includes(c)) ? "austin" : "dfw";

  const listing: NormalizedListing = {
    externalId: `email-${Date.now()}-${extracted.address.replace(/\s+/g, "-").toLowerCase().slice(0, 40)}`,
    sourceSlug: "email",
    address: extracted.address,
    city,
    state,
    zip: extracted.zip,
    lat: geo.lat,
    lng: geo.lng,
    market,
    propertyType: extracted.propertyType || "Residential",
    listingType: extracted.listingType || "Sale",
    buildingSf: extracted.sqft,
    lotSizeAcres: extracted.lotSize,
    priceAmount: extracted.price,
    priceUnit: "total",
    yearBuilt: extracted.yearBuilt,
    brokerName: extracted.agentName || email.from,
    brokerCompany: extracted.agentCompany,
    brokerPhone: extracted.agentPhone,
    brokerEmail: extracted.agentEmail,
    description: extracted.description,
    imageUrl: extracted.imageUrls?.[0],
    sourceUrl: undefined,
    rawData: {
      emailFrom: email.from,
      emailSubject: email.subject,
      receivedAt: email.receivedAt,
      extractionMethod: method,
      confidence: extracted.confidence,
    },
    beds: extracted.beds,
    baths: extracted.baths,
    searchMode: "residential",
  };

  return { listing, extracted, method };
}
