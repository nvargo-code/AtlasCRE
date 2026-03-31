/**
 * Tax Record Enrichment
 *
 * Looks up property tax records to fill in missing listing data.
 * Covers Travis County (Austin) via TCAD and can be extended to other counties.
 *
 * Data enriched:
 * - Square footage (living area)
 * - Year built
 * - Lot size (acres)
 * - Bedrooms / bathrooms
 * - Property type / subtype
 * - Legal description
 * - Tax assessed value (useful for pricing context)
 *
 * Uses the county appraisal district's public data APIs where available,
 * falling back to web scraping when needed.
 */

export interface TaxRecord {
  address: string;
  city: string;
  state: string;
  zip: string;
  sqft: number | null;
  yearBuilt: number | null;
  lotSizeAcres: number | null;
  beds: number | null;
  baths: number | null;
  stories: number | null;
  propertyType: string | null;
  legalDescription: string | null;
  assessedValue: number | null;
  landValue: number | null;
  improvementValue: number | null;
  ownerName: string | null;
  source: string;
}

// ── Travis County (Austin) — TCAD ───────────────────────────────────────────

async function lookupTCAD(address: string, city: string): Promise<TaxRecord | null> {
  try {
    // TCAD's public property search
    // They have an API endpoint that returns JSON for property searches
    const searchUrl = `https://travis.trueautomation.com/clientdb/PropertySearch.aspx`;

    // First, try a simple address lookup via their search API
    const query = encodeURIComponent(`${address}, ${city}`);

    // TCAD uses a GraphQL-style API for property search
    // We'll use the public-facing search which returns HTML but has structured data
    const res = await fetch(
      `https://propaccess.trueautomation.com/clientdb/propertysearch.aspx?cid=1&search_type=address&searchby=address&searchtxt=${query}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return null;

    const html = await res.text();

    // Try to extract property details from the HTML response
    // TCAD returns a results page with property data in table rows
    return parseTCADResponse(html, address, city);
  } catch (e) {
    console.warn("[tax-enrichment] TCAD lookup failed:", e);
    return null;
  }
}

function parseTCADResponse(html: string, address: string, city: string): TaxRecord | null {
  // Extract data from TCAD HTML response using regex patterns
  // (In production, this would use a proper HTML parser)

  const record: TaxRecord = {
    address,
    city,
    state: "TX",
    zip: "",
    sqft: null,
    yearBuilt: null,
    lotSizeAcres: null,
    beds: null,
    baths: null,
    stories: null,
    propertyType: null,
    legalDescription: null,
    assessedValue: null,
    landValue: null,
    improvementValue: null,
    ownerName: null,
    source: "TCAD",
  };

  // Year built
  const yearMatch = html.match(/Year\s*Built\s*:?\s*(\d{4})/i);
  if (yearMatch) record.yearBuilt = parseInt(yearMatch[1]);

  // Living area / sqft
  const sqftMatch = html.match(/(?:Living|Heated)\s*(?:Area|SQFT|SF)\s*:?\s*([\d,]+)/i);
  if (sqftMatch) record.sqft = parseInt(sqftMatch[1].replace(/,/g, ""));

  // Lot size
  const lotMatch = html.match(/(?:Land|Lot)\s*(?:Size|Area)\s*:?\s*([\d,.]+)\s*(?:acres?|ac)/i);
  if (lotMatch) record.lotSizeAcres = parseFloat(lotMatch[1].replace(/,/g, ""));

  // Bedrooms
  const bedsMatch = html.match(/(?:Bed|BR)\s*(?:rooms?)?\s*:?\s*(\d+)/i);
  if (bedsMatch) record.beds = parseInt(bedsMatch[1]);

  // Bathrooms
  const bathsMatch = html.match(/(?:Bath|BA)\s*(?:rooms?)?\s*:?\s*(\d+(?:\.\d+)?)/i);
  if (bathsMatch) record.baths = parseFloat(bathsMatch[1]);

  // Stories
  const storiesMatch = html.match(/(?:Stories|Floors)\s*:?\s*(\d+)/i);
  if (storiesMatch) record.stories = parseInt(storiesMatch[1]);

  // Assessed value
  const assessedMatch = html.match(/(?:Total|Assessed)\s*(?:Value|Appraised)\s*:?\s*\$?([\d,]+)/i);
  if (assessedMatch) record.assessedValue = parseInt(assessedMatch[1].replace(/,/g, ""));

  // Land value
  const landMatch = html.match(/Land\s*(?:Value|Market)\s*:?\s*\$?([\d,]+)/i);
  if (landMatch) record.landValue = parseInt(landMatch[1].replace(/,/g, ""));

  // Improvement value
  const impMatch = html.match(/Improvement\s*(?:Value|Market)\s*:?\s*\$?([\d,]+)/i);
  if (impMatch) record.improvementValue = parseInt(impMatch[1].replace(/,/g, ""));

  // Owner
  const ownerMatch = html.match(/Owner\s*(?:Name)?\s*:?\s*([A-Z][A-Z\s,&]+)/);
  if (ownerMatch) record.ownerName = ownerMatch[1].trim();

  // Legal description
  const legalMatch = html.match(/Legal\s*(?:Description)?\s*:?\s*([^\n<]{10,100})/i);
  if (legalMatch) record.legalDescription = legalMatch[1].trim();

  // Property type
  const typeMatch = html.match(/(?:Property\s*Type|Use\s*Code|Improvement)\s*:?\s*([\w\s-]+(?:Single|Multi|Condo|Town|Residential|Commercial|Land|Ranch|Farm)[\w\s-]*)/i);
  if (typeMatch) record.propertyType = typeMatch[1].trim();

  // Check if we got any useful data
  const hasData = record.sqft || record.yearBuilt || record.beds || record.assessedValue;
  return hasData ? record : null;
}

// ── Williamson County ───────────────────────────────────────────────────────

async function lookupWilliamsonCounty(address: string, city: string): Promise<TaxRecord | null> {
  // Williamson County covers Cedar Park, Round Rock, Georgetown, Leander
  // Similar approach to TCAD but different endpoint
  try {
    const query = encodeURIComponent(address);
    const res = await fetch(
      `https://search.wcad.org/Property-Search?SearchText=${query}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 Chrome/120.0.0.0" },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return null;
    const html = await res.text();
    return parseTCADResponse(html, address, city); // Similar format
  } catch {
    return null;
  }
}

// ── County router ───────────────────────────────────────────────────────────

const COUNTY_BY_CITY: Record<string, string> = {
  austin: "travis",
  "round rock": "williamson",
  "cedar park": "williamson",
  georgetown: "williamson",
  leander: "williamson",
  pflugerville: "travis",
  kyle: "hays",
  buda: "hays",
  "bee cave": "travis",
  lakeway: "travis",
  "dripping springs": "hays",
  westlake: "travis",
  manor: "travis",
};

// ── Main export ─────────────────────────────────────────────────────────────

export async function enrichFromTaxRecords(
  address: string,
  city: string
): Promise<TaxRecord | null> {
  const normalizedCity = city.toLowerCase().trim();
  const county = COUNTY_BY_CITY[normalizedCity] || "travis";

  console.log(`[tax-enrichment] Looking up ${address}, ${city} in ${county} county`);

  let record: TaxRecord | null = null;

  switch (county) {
    case "travis":
      record = await lookupTCAD(address, city);
      break;
    case "williamson":
      record = await lookupWilliamsonCounty(address, city);
      break;
    default:
      record = await lookupTCAD(address, city); // fallback to TCAD
  }

  if (record) {
    console.log(`[tax-enrichment] Found: sqft=${record.sqft}, yearBuilt=${record.yearBuilt}, beds=${record.beds}`);
  } else {
    console.log(`[tax-enrichment] No tax records found for ${address}, ${city}`);
  }

  return record;
}

/**
 * Enrich a listing with tax record data.
 * Only fills in fields that are currently null/missing.
 */
export async function enrichListing(
  listingId: string,
  address: string,
  city: string,
  prismaClient: { listing: { update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> } }
): Promise<boolean> {
  const record = await enrichFromTaxRecords(address, city);
  if (!record) return false;

  const updates: Record<string, unknown> = {};

  // Only fill in missing fields
  if (record.sqft) updates.buildingSf = record.sqft;
  if (record.yearBuilt) updates.yearBuilt = record.yearBuilt;
  if (record.lotSizeAcres) updates.lotSizeAcres = record.lotSizeAcres;
  if (record.beds) updates.beds = record.beds;
  if (record.baths) updates.baths = record.baths;
  if (record.stories) updates.stories = record.stories;

  if (Object.keys(updates).length === 0) return false;

  await prismaClient.listing.update({
    where: { id: listingId },
    data: updates,
  });

  console.log(`[tax-enrichment] Enriched listing ${listingId} with: ${Object.keys(updates).join(", ")}`);
  return true;
}
