import { NextRequest, NextResponse } from "next/server";
import { parseEmailToListing } from "@/ingestion/email-parser";
import { prisma } from "@/lib/prisma";
import { generateDedupeKey } from "@/ingestion/dedupe";

/**
 * POST /api/ingest/email
 *
 * Receives forwarded emails containing pocket/off-market listing data.
 *
 * Supports two input formats:
 *
 * 1. Direct JSON (from your own forwarding system):
 *    { from, subject, body, html?, receivedAt }
 *
 * 2. SendGrid Inbound Parse (if using a dedicated email address):
 *    multipart/form-data with fields: from, subject, text, html, ...
 *
 * Authentication: Bearer token via INGEST_EMAIL_SECRET env var
 */

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Auth check
  const secret = process.env.INGEST_EMAIL_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let emailData: { from: string; subject: string; body: string; html?: string; receivedAt?: string };

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // SendGrid Inbound Parse format
    const formData = await req.formData();
    emailData = {
      from: formData.get("from") as string || "",
      subject: formData.get("subject") as string || "",
      body: formData.get("text") as string || "",
      html: formData.get("html") as string || undefined,
      receivedAt: new Date().toISOString(),
    };
  } else {
    // Direct JSON format
    emailData = await req.json();
  }

  if (!emailData.body && !emailData.html) {
    return NextResponse.json({ error: "No email body provided" }, { status: 400 });
  }

  console.log(`[email-ingest] Processing email from: ${emailData.from}, subject: ${emailData.subject}`);

  // Parse the email
  const { listing, extracted, method } = await parseEmailToListing({
    from: emailData.from,
    subject: emailData.subject,
    body: emailData.body || "",
    html: emailData.html,
    receivedAt: emailData.receivedAt || new Date().toISOString(),
  });

  if (!listing) {
    console.log("[email-ingest] Could not extract listing from email", { extracted, method });
    return NextResponse.json({
      success: false,
      message: "Could not extract a valid listing from this email",
      extracted,
      method,
    });
  }

  // Ensure the "email" source exists in the database
  let source = await prisma.listingSource.findUnique({ where: { slug: "email" } });
  if (!source) {
    source = await prisma.listingSource.create({
      data: {
        name: "Email Forward",
        slug: "email",
        baseUrl: null,
        enabled: true,
      },
    });
  }

  // Generate dedupe key and upsert
  const dedupeKey = generateDedupeKey(listing);

  const upsertedListing = await prisma.listing.upsert({
    where: { dedupeKey },
    create: {
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
      garageSpaces: listing.garageSpaces || null,
      stories: listing.stories || null,
      propSubType: listing.propSubType || null,
      searchMode: listing.searchMode || "residential",
    },
    update: {
      priceAmount: listing.priceAmount || undefined,
      description: listing.description || undefined,
      imageUrl: listing.imageUrl || undefined,
      updatedAt: new Date(),
    },
  });

  // Create variant for email source
  await prisma.listingVariant.upsert({
    where: {
      sourceId_externalId: {
        sourceId: source.id,
        externalId: listing.externalId,
      },
    },
    create: {
      listingId: upsertedListing.id,
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
    update: {
      priceAmount: listing.priceAmount || null,
      description: listing.description || null,
      rawData: listing.rawData as object,
      fetchedAt: new Date(),
    },
  });

  // Update source timestamp
  await prisma.listingSource.update({
    where: { id: source.id },
    data: { lastRunAt: new Date(), lastRunStatus: "ok" },
  });

  console.log(`[email-ingest] Listing created/updated: ${upsertedListing.id} (${listing.address})`);

  return NextResponse.json({
    success: true,
    listingId: upsertedListing.id,
    address: listing.address,
    extracted,
    method,
    confidence: extracted.confidence,
  });
}
