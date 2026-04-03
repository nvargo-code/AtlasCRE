/**
 * GoHighLevel (GHL) Integration
 *
 * Pushes leads and behavioral data to GoHighLevel CRM via webhook.
 * Supports:
 * - New lead registration (from RegistrationGate, DreamHomeFinder, contact form)
 * - Lead activity updates (search behavior, saved homes, showing requests)
 * - Lead tagging (buyer/seller, price range, neighborhoods, search mode)
 *
 * Configure GHL_WEBHOOK_URL in .env to enable.
 */

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL;

interface GHLContact {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  source: string;
  tags?: string[];
  customFields?: Record<string, string>;
}

interface GHLActivityUpdate {
  email: string;
  action: string;
  details: Record<string, unknown>;
}

/**
 * Push a new lead to GoHighLevel.
 */
export async function pushLeadToGHL(contact: GHLContact): Promise<boolean> {
  if (!GHL_WEBHOOK_URL) {
    console.log("[GHL] Webhook not configured, skipping push for:", contact.email);
    return false;
  }

  try {
    const payload = {
      // Standard GHL webhook fields
      first_name: contact.firstName || "",
      last_name: contact.lastName || "",
      email: contact.email,
      phone: contact.phone || "",
      source: contact.source,
      tags: (contact.tags || []).join(","),
      // Custom fields for real estate data
      ...Object.fromEntries(
        Object.entries(contact.customFields || {}).map(([k, v]) => [`custom_${k}`, v])
      ),
      // Metadata
      timestamp: new Date().toISOString(),
      platform: "AtlasCRE SuperSearch",
    };

    const res = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("[GHL] Webhook failed:", res.status, await res.text());
      return false;
    }

    console.log("[GHL] Lead pushed:", contact.email, "source:", contact.source);
    return true;
  } catch (e) {
    console.error("[GHL] Webhook error:", e);
    return false;
  }
}

/**
 * Push activity/behavioral update for an existing contact.
 */
export async function pushActivityToGHL(update: GHLActivityUpdate): Promise<boolean> {
  if (!GHL_WEBHOOK_URL) return false;

  try {
    const payload = {
      email: update.email,
      action: update.action,
      ...update.details,
      timestamp: new Date().toISOString(),
      platform: "AtlasCRE SuperSearch",
    };

    const res = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Build tags from search behavior / registration data.
 */
export function buildLeadTags(data: {
  searchMode?: string;
  priceMin?: number;
  priceMax?: number;
  neighborhoods?: string[];
  bedsMin?: number;
  source?: string;
  type?: "buyer" | "seller" | "investor";
}): string[] {
  const tags: string[] = [];

  if (data.type) tags.push(data.type);
  if (data.searchMode) tags.push(data.searchMode);
  if (data.source) tags.push(`source:${data.source}`);

  if (data.priceMax) {
    if (data.priceMax <= 400000) tags.push("budget:under-400k");
    else if (data.priceMax <= 600000) tags.push("budget:400-600k");
    else if (data.priceMax <= 1000000) tags.push("budget:600k-1m");
    else tags.push("budget:1m-plus");
  }

  if (data.neighborhoods) {
    for (const hood of data.neighborhoods.slice(0, 3)) {
      tags.push(`area:${hood}`);
    }
  }

  if (data.bedsMin) tags.push(`beds:${data.bedsMin}+`);

  return tags;
}

/**
 * Build custom fields from search behavior.
 */
export function buildCustomFields(data: {
  searchMode?: string;
  priceRange?: string;
  neighborhoods?: string[];
  bedsMin?: number;
  bathsMin?: number;
  listingsViewed?: number;
  listingsSaved?: number;
  searchQuery?: string;
}): Record<string, string> {
  const fields: Record<string, string> = {};

  if (data.searchMode) fields.search_mode = data.searchMode;
  if (data.priceRange) fields.price_range = data.priceRange;
  if (data.neighborhoods?.length) fields.target_areas = data.neighborhoods.join(", ");
  if (data.bedsMin) fields.min_beds = String(data.bedsMin);
  if (data.bathsMin) fields.min_baths = String(data.bathsMin);
  if (data.listingsViewed) fields.listings_viewed = String(data.listingsViewed);
  if (data.listingsSaved) fields.listings_saved = String(data.listingsSaved);
  if (data.searchQuery) fields.last_search = data.searchQuery;

  return fields;
}
