/**
 * Gmail Scanner
 *
 * Connects to Gmail via OAuth2 and scans for pocket listing emails.
 * Runs 4x daily via cron. Tracks processed message IDs to avoid re-processing.
 *
 * Required env vars:
 *   GMAIL_CLIENT_ID       - Google OAuth2 client ID
 *   GMAIL_CLIENT_SECRET   - Google OAuth2 client secret
 *   GMAIL_REFRESH_TOKEN   - OAuth2 refresh token (obtained via one-time auth flow)
 *   GMAIL_SCAN_ADDRESS    - Email address to scan (e.g., david@shapirore.com)
 *
 * Setup flow:
 *   1. Create OAuth2 credentials in Google Cloud Console
 *   2. Run the one-time auth flow at /api/gmail/auth to get refresh token
 *   3. Set GMAIL_REFRESH_TOKEN in env vars
 *   4. Cron runs automatically 4x daily
 */

import { detectPocketListing, DetectionResult } from "./pocket-detector";
import { parseEmailToListing, ParsedEmail } from "./email-parser";
import { prisma } from "@/lib/prisma";
import { generateDedupeKey } from "./dedupe";

// ── Gmail API types ─────────────────────────────────────────────────────────

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    mimeType?: string;
    body?: { data?: string; size?: number };
    parts?: GmailMessagePart[];
  };
}

interface GmailMessagePart {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// ── OAuth2 token management ─────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth2 credentials not configured (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to refresh Gmail token: ${error}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── Gmail API helpers ───────────────────────────────────────────────────────

async function gmailFetch(path: string, accessToken: string): Promise<Response> {
  const email = process.env.GMAIL_SCAN_ADDRESS || "me";
  return fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(email)}/${path}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractHeader(message: GmailMessage, name: string): string {
  return message.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value || "";
}

function extractBody(message: GmailMessage): { text: string; html: string } {
  let text = "";
  let html = "";

  function walkParts(parts: GmailMessagePart[]) {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text += decodeBase64Url(part.body.data);
      } else if (part.mimeType === "text/html" && part.body?.data) {
        html += decodeBase64Url(part.body.data);
      } else if (part.parts) {
        walkParts(part.parts);
      }
    }
  }

  if (message.payload?.parts) {
    walkParts(message.payload.parts);
  } else if (message.payload?.body?.data) {
    const decoded = decodeBase64Url(message.payload.body.data);
    if (message.payload.mimeType === "text/html") {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  return { text, html };
}

// ── URL extraction for photo scraping ───────────────────────────────────────

export function extractUrlsFromEmail(text: string, html: string): string[] {
  const urls = new Set<string>();

  // Extract from plain text
  const urlPattern = /https?:\/\/[^\s<>"')\]]+/gi;
  for (const match of text.matchAll(urlPattern)) {
    urls.add(match[0]);
  }

  // Extract from HTML href attributes
  const hrefPattern = /href=["'](https?:\/\/[^"']+)["']/gi;
  for (const match of html.matchAll(hrefPattern)) {
    urls.add(match[1]);
  }

  // Extract image URLs from HTML
  const imgPattern = /src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi;
  for (const match of html.matchAll(imgPattern)) {
    urls.add(match[1]);
  }

  // Filter out common non-listing URLs
  const skipDomains = [
    "google.com", "gmail.com", "facebook.com", "twitter.com", "instagram.com",
    "linkedin.com", "youtube.com", "unsubscribe", "mailchimp.com", "constantcontact",
    "tracking", "click.", "open.", "pixel", "beacon",
  ];

  return [...urls].filter((url) => !skipDomains.some((d) => url.includes(d)));
}

// ── Main scan function ──────────────────────────────────────────────────────

export interface ScanResult {
  messagesScanned: number;
  pocketListingsFound: number;
  listingsIngested: number;
  errors: string[];
  details: Array<{
    messageId: string;
    from: string;
    subject: string;
    detection: DetectionResult;
    ingested: boolean;
    listingId?: string;
  }>;
}

export async function scanGmailForPocketListings(): Promise<ScanResult> {
  const result: ScanResult = {
    messagesScanned: 0,
    pocketListingsFound: 0,
    listingsIngested: 0,
    errors: [],
    details: [],
  };

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (e) {
    result.errors.push(`Auth failed: ${e}`);
    return result;
  }

  // Search for recent real estate emails (last 6 hours to overlap with 4x daily runs)
  const query = encodeURIComponent(
    "newer_than:6h (listing OR property OR home OR house OR sale OR price) -category:promotions -category:social"
  );

  try {
    const listRes = await gmailFetch(`messages?q=${query}&maxResults=50`, accessToken);
    if (!listRes.ok) {
      result.errors.push(`Gmail list failed: ${listRes.status}`);
      return result;
    }

    const listData: GmailListResponse = await listRes.json();
    const messages = listData.messages || [];

    console.log(`[gmail-scan] Found ${messages.length} candidate emails`);

    for (const msgRef of messages) {
      try {
        // Check if already processed
        const existing = await prisma.processedEmail.findUnique({
          where: { gmailMessageId: msgRef.id },
        });
        if (existing) continue;

        // Fetch full message
        const msgRes = await gmailFetch(`messages/${msgRef.id}?format=full`, accessToken);
        if (!msgRes.ok) continue;

        const message: GmailMessage = await msgRes.json();
        const from = extractHeader(message, "From");
        const subject = extractHeader(message, "Subject");
        const date = extractHeader(message, "Date");
        const { text, html } = extractBody(message);

        result.messagesScanned++;

        // Run pocket listing detection
        const detection = detectPocketListing(subject, text || html);

        // Record in database regardless of outcome
        const emailRecord = await prisma.processedEmail.create({
          data: {
            gmailMessageId: msgRef.id,
            threadId: msgRef.threadId,
            from,
            subject,
            receivedAt: date ? new Date(date) : new Date(),
            isPocketListing: detection.isPocketListing,
            confidence: detection.confidence,
            keywords: detection.matchedKeywords,
            mlsNumber: detection.mlsNumber,
            status: detection.isPocketListing ? "processing" : "skipped",
            rawBody: (text || html).slice(0, 10000), // Cap storage
          },
        });

        if (!detection.isPocketListing) {
          result.details.push({
            messageId: msgRef.id,
            from, subject, detection,
            ingested: false,
          });
          continue;
        }

        result.pocketListingsFound++;

        // Parse the email to extract listing data
        const emailData: ParsedEmail = {
          from,
          subject,
          body: text,
          html: html || undefined,
          receivedAt: date || new Date().toISOString(),
        };

        const { listing, extracted } = await parseEmailToListing(emailData);

        if (!listing) {
          await prisma.processedEmail.update({
            where: { id: emailRecord.id },
            data: {
              status: "error",
              errorMessage: "Could not extract listing data from email",
              extractedData: extracted as object,
            },
          });
          result.details.push({
            messageId: msgRef.id,
            from, subject, detection,
            ingested: false,
          });
          continue;
        }

        // Check if this listing already exists in SuperSearch
        const dedupeKey = generateDedupeKey(listing);
        const existingListing = await prisma.listing.findUnique({
          where: { dedupeKey },
        });

        if (existingListing) {
          await prisma.processedEmail.update({
            where: { id: emailRecord.id },
            data: {
              status: "skipped",
              listingId: existingListing.id,
              errorMessage: "Listing already exists in SuperSearch",
              extractedData: extracted as object,
            },
          });
          result.details.push({
            messageId: msgRef.id,
            from, subject, detection,
            ingested: false,
            listingId: existingListing.id,
          });
          continue;
        }

        // Ensure email source exists
        let source = await prisma.listingSource.findUnique({ where: { slug: "email" } });
        if (!source) {
          source = await prisma.listingSource.create({
            data: { name: "Email Forward", slug: "email", enabled: true },
          });
        }

        // Ingest the listing
        const newListing = await prisma.listing.create({
          data: {
            address: listing.address,
            city: listing.city,
            state: listing.state,
            zip: listing.zip || null,
            lat: listing.lat,
            lng: listing.lng,
            market: listing.market,
            propertyType: listing.propertyType,
            listingType: listing.listingType,
            buildingSf: listing.buildingSf || null,
            lotSizeAcres: listing.lotSizeAcres || null,
            priceAmount: listing.priceAmount || null,
            priceUnit: listing.priceUnit || null,
            yearBuilt: listing.yearBuilt || null,
            brokerName: listing.brokerName || null,
            brokerCompany: listing.brokerCompany || null,
            description: listing.description || null,
            imageUrl: listing.imageUrl || null,
            status: "active",
            dedupeKey,
            beds: listing.beds || null,
            baths: listing.baths || null,
            searchMode: listing.searchMode || "residential",
          },
        });

        // Create variant
        await prisma.listingVariant.create({
          data: {
            listingId: newListing.id,
            sourceId: source.id,
            externalId: listing.externalId,
            priceAmount: listing.priceAmount || null,
            priceUnit: listing.priceUnit || null,
            buildingSf: listing.buildingSf || null,
            description: listing.description || null,
            brokerName: listing.brokerName || null,
            brokerPhone: listing.brokerPhone || null,
            brokerEmail: listing.brokerEmail || null,
            imageUrl: listing.imageUrl || null,
            rawData: listing.rawData as object,
          },
        });

        // Extract photo URLs from email for later scraping
        const photoUrls = extractUrlsFromEmail(text, html).filter(
          (url) => /\.(jpg|jpeg|png|webp)/i.test(url)
        );
        if (photoUrls.length > 0) {
          await prisma.listingPhoto.createMany({
            data: photoUrls.slice(0, 20).map((url, i) => ({
              listingId: newListing.id,
              url,
              sourceUrl: url,
              position: i,
            })),
          });
        }

        // Update email record
        await prisma.processedEmail.update({
          where: { id: emailRecord.id },
          data: {
            status: "ingested",
            listingId: newListing.id,
            extractedData: extracted as object,
          },
        });

        result.listingsIngested++;
        result.details.push({
          messageId: msgRef.id,
          from, subject, detection,
          ingested: true,
          listingId: newListing.id,
        });

        console.log(`[gmail-scan] Ingested pocket listing: ${listing.address} (from ${from})`);
      } catch (err) {
        result.errors.push(`Error processing message ${msgRef.id}: ${err}`);
      }
    }
  } catch (e) {
    result.errors.push(`Gmail scan failed: ${e}`);
  }

  console.log(
    `[gmail-scan] Complete: ${result.messagesScanned} scanned, ` +
    `${result.pocketListingsFound} pocket listings found, ` +
    `${result.listingsIngested} ingested`
  );

  return result;
}
