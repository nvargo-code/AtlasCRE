/**
 * Pocket Listing Detector
 *
 * Analyzes email content to determine if it contains an off-market/pocket
 * listing that should be ingested into SuperSearch.
 *
 * Scoring system:
 * - Positive signals: keywords like "off market", "pocket listing", "exclusive"
 * - Negative signals: MLS numbers (with context analysis), "just listed on MLS"
 * - Neutral: general real estate content without clear pocket listing signals
 */

export interface DetectionResult {
  isPocketListing: boolean;
  confidence: number; // 0-1
  score: number; // raw score before normalization
  matchedKeywords: string[];
  mlsNumber: string | null;
  mlsContext: "current_listing" | "reference_only" | "none";
  reasoning: string;
}

// ── Positive signals (indicates off-market) ─────────────────────────────────

const STRONG_POSITIVE_KEYWORDS = [
  { pattern: /\bpocket\s*listing\b/i, keyword: "pocket listing", weight: 5 },
  { pattern: /\boff[\s-]*market\b/i, keyword: "off market", weight: 5 },
  { pattern: /\boff[\s-]*mls\b/i, keyword: "off MLS", weight: 5 },
  { pattern: /\bexclusive\s*listing\b/i, keyword: "exclusive listing", weight: 4 },
  { pattern: /\bcoming\s*soon\b/i, keyword: "coming soon", weight: 3 },
  { pattern: /\bpre[\s-]*market\b/i, keyword: "pre-market", weight: 4 },
  { pattern: /\bnot\s*(yet\s*)?on\s*(the\s*)?market\b/i, keyword: "not yet on market", weight: 5 },
  { pattern: /\bnot\s*(yet\s*)?on\s*(the\s*)?mls\b/i, keyword: "not on MLS", weight: 5 },
  { pattern: /\bbefore\s*(it\s*)?hits?\s*(the\s*)?market\b/i, keyword: "before it hits market", weight: 4 },
  { pattern: /\bprivate(ly)?\s*(listed|offering|sale)\b/i, keyword: "privately listed", weight: 4 },
  { pattern: /\bwhisper\s*listing\b/i, keyword: "whisper listing", weight: 5 },
  { pattern: /\bquiet\s*listing\b/i, keyword: "quiet listing", weight: 4 },
  { pattern: /\bunlisted\b/i, keyword: "unlisted", weight: 3 },
  { pattern: /\bbroker[\s-]*(?:only|exclusive)\b/i, keyword: "broker exclusive", weight: 4 },
  { pattern: /\bagent[\s-]*(?:only|exclusive)\b/i, keyword: "agent exclusive", weight: 4 },
  { pattern: /\bnon[\s-]*mls\b/i, keyword: "non-MLS", weight: 5 },
  { pattern: /\bdo\s*not\s*(?:share|distribute|forward)\b/i, keyword: "do not share", weight: 2 },
];

// ── Moderate positive signals ───────────────────────────────────────────────

const MODERATE_POSITIVE_KEYWORDS = [
  { pattern: /\bfor\s*sale\s*by\s*owner\b/i, keyword: "FSBO", weight: 2 },
  { pattern: /\bnew\s*construction\b/i, keyword: "new construction", weight: 1 },
  { pattern: /\bprice\s*reduction\b/i, keyword: "price reduction", weight: 0 }, // neutral
  { pattern: /\bjust\s*reduced\b/i, keyword: "just reduced", weight: 0 },
  { pattern: /\bopen\s*house\b/i, keyword: "open house", weight: -1 }, // usually on MLS
  { pattern: /\bbuyer\s*need\b/i, keyword: "buyer need", weight: 1 },
  { pattern: /\blooking\s*for\s*(?:a\s*)?buyer\b/i, keyword: "looking for buyer", weight: 2 },
  { pattern: /\bwill\s*(?:consider|entertain)\s*offers?\b/i, keyword: "will consider offers", weight: 3 },
  { pattern: /\bmake[\s-]*me[\s-]*(?:an?\s*)?(?:offer|sell)\b/i, keyword: "make me sell", weight: 3 },
];

// ── Negative signals (indicates ON the MLS) ─────────────────────────────────

const NEGATIVE_KEYWORDS = [
  { pattern: /\bjust\s*listed\s*(?:on\s*(?:the\s*)?mls)?\b/i, keyword: "just listed", weight: -3 },
  { pattern: /\bnow\s*(?:available\s*)?on\s*(?:the\s*)?mls\b/i, keyword: "now on MLS", weight: -4 },
  { pattern: /\bactive\s*on\s*mls\b/i, keyword: "active on MLS", weight: -4 },
  { pattern: /\bmls\s*#?\s*\d{5,}/i, keyword: "MLS number present", weight: -2 }, // -2 because needs context
  { pattern: /\breduced\s*on\s*mls\b/i, keyword: "reduced on MLS", weight: -3 },
  { pattern: /\bview\s*on\s*(?:zillow|realtor|redfin|har)\b/i, keyword: "view on portal", weight: -3 },
];

// ── MLS number detection with context ───────────────────────────────────────

const MLS_PATTERNS = [
  /\bMLS\s*#?\s*:?\s*(\d{5,10})\b/i,
  /\bMLS\s*(?:Number|No\.?|ID)\s*:?\s*(\d{5,10})\b/i,
  /\b#(\d{7,10})\b/, // bare 7-10 digit number often = MLS#
];

const MLS_REFERENCE_CONTEXT = [
  /\b(?:previously|formerly|was|prior)\s*(?:listed|on\s*(?:the\s*)?mls)/i,
  /\b(?:expired|withdrawn|cancelled)\s*(?:listing|mls)/i,
  /\b(?:sold|closed)\s*(?:for|at)\b/i,
  /\b(?:off[\s-]*market|no\s*longer\s*(?:on|available|listed))/i,
  /\b(?:taken?\s*off|pulled\s*from|removed\s*from)\s*(?:the\s*)?(?:mls|market)/i,
];

function analyzeMlsContext(text: string, mlsNumber: string): "current_listing" | "reference_only" | "none" {
  if (!mlsNumber) return "none";

  // Look for context clues near the MLS number
  const mlsIndex = text.toLowerCase().indexOf(mlsNumber.toLowerCase());
  const surroundingText = text.slice(
    Math.max(0, mlsIndex - 200),
    Math.min(text.length, mlsIndex + 200)
  );

  // Check if it's referencing a past listing
  for (const pattern of MLS_REFERENCE_CONTEXT) {
    if (pattern.test(surroundingText)) {
      return "reference_only";
    }
  }

  // If pocket listing keywords are also present, it's likely a reference
  const hasPocketKeywords = STRONG_POSITIVE_KEYWORDS.some((k) => k.pattern.test(text));
  if (hasPocketKeywords) {
    return "reference_only";
  }

  return "current_listing";
}

// ── Content quality signals ─────────────────────────────────────────────────

function hasListingContent(text: string): boolean {
  // Check if the email actually contains listing-like content
  const hasAddress = /\d{1,6}\s+[\w\s.]+(?:St|Street|Ave|Avenue|Blvd|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court)/i.test(text);
  const hasPrice = /\$[\d,]+/i.test(text);
  const hasBedBath = /\d+\s*(?:bed|bath|br|ba|bedroom|bathroom)/i.test(text);

  return hasAddress || (hasPrice && hasBedBath);
}

// ── Main detector ───────────────────────────────────────────────────────────

export function detectPocketListing(subject: string, body: string): DetectionResult {
  const fullText = `${subject}\n\n${body}`;
  let score = 0;
  const matchedKeywords: string[] = [];

  // Check for listing content first — skip if it's not about a property
  if (!hasListingContent(fullText)) {
    return {
      isPocketListing: false,
      confidence: 0,
      score: 0,
      matchedKeywords: [],
      mlsNumber: null,
      mlsContext: "none",
      reasoning: "Email does not appear to contain real estate listing content",
    };
  }

  // Score positive keywords
  for (const { pattern, keyword, weight } of STRONG_POSITIVE_KEYWORDS) {
    if (pattern.test(fullText)) {
      score += weight;
      matchedKeywords.push(keyword);
    }
  }

  for (const { pattern, keyword, weight } of MODERATE_POSITIVE_KEYWORDS) {
    if (pattern.test(fullText)) {
      score += weight;
      if (weight > 0) matchedKeywords.push(keyword);
    }
  }

  // Score negative keywords
  for (const { pattern, keyword, weight } of NEGATIVE_KEYWORDS) {
    if (pattern.test(fullText)) {
      score += weight;
      matchedKeywords.push(keyword);
    }
  }

  // MLS number analysis
  let mlsNumber: string | null = null;
  let mlsContext: "current_listing" | "reference_only" | "none" = "none";

  for (const pattern of MLS_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      mlsNumber = match[1];
      mlsContext = analyzeMlsContext(fullText, mlsNumber);

      if (mlsContext === "current_listing") {
        // MLS# present and appears to be a current active listing
        score -= 3;
        matchedKeywords.push(`MLS# ${mlsNumber} (active)`);
      } else if (mlsContext === "reference_only") {
        // MLS# is referencing a past listing — this might BE a pocket listing
        score += 1;
        matchedKeywords.push(`MLS# ${mlsNumber} (past reference)`);
      }
      break;
    }
  }

  // No MLS number + has listing content = slight positive signal
  if (!mlsNumber && hasListingContent(fullText)) {
    score += 1;
    matchedKeywords.push("no MLS# found");
  }

  // Subject line boost — pocket listing keywords in subject are stronger signals
  for (const { pattern, keyword } of STRONG_POSITIVE_KEYWORDS) {
    if (pattern.test(subject)) {
      score += 2; // Extra weight for subject line matches
      if (!matchedKeywords.includes(keyword)) {
        matchedKeywords.push(`${keyword} (subject)`);
      }
    }
  }

  // Normalize confidence to 0-1
  const maxPossibleScore = 20; // rough max if many keywords match
  const confidence = Math.max(0, Math.min(1, score / maxPossibleScore));

  // Decision threshold
  const isPocketListing = score >= 3;

  // Build reasoning
  let reasoning: string;
  if (isPocketListing) {
    reasoning = `Detected as pocket listing (score: ${score}). Key signals: ${matchedKeywords.join(", ")}`;
  } else if (score > 0) {
    reasoning = `Possible pocket listing but below threshold (score: ${score}). Signals: ${matchedKeywords.join(", ")}`;
  } else {
    reasoning = `Not a pocket listing (score: ${score}). ${mlsNumber ? `MLS# ${mlsNumber} appears to be active.` : "No clear off-market signals."}`;
  }

  return {
    isPocketListing,
    confidence,
    score,
    matchedKeywords,
    mlsNumber,
    mlsContext,
    reasoning,
  };
}
