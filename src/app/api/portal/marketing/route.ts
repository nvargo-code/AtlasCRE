import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/marketing?listingId=xxx
 * Returns auto-generated marketing content for a listing.
 *
 * POST /api/portal/marketing
 * Generates marketing content for a listing using AI.
 * Body: { listingId: string }
 */

export const dynamic = "force-dynamic";

function formatPrice(n: number | null): string {
  if (!n) return "Contact for Price";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function generateInstagramPost(listing: {
  address: string; city: string; zip: string | null;
  priceAmount: number | null; beds: number | null; baths: number | null;
  buildingSf: number | null; description: string | null; propertyType: string;
  listingType: string;
}): string {
  const price = formatPrice(listing.priceAmount);
  const details = [
    listing.beds ? `${listing.beds} Bed` : null,
    listing.baths ? `${listing.baths} Bath` : null,
    listing.buildingSf ? `${listing.buildingSf.toLocaleString()} SF` : null,
  ].filter(Boolean).join(" | ");

  return `🏡 NEW LISTING

${listing.address}
${listing.city}, TX ${listing.zip || ""}

${price} ${details ? `| ${details}` : ""}

${listing.description ? listing.description.slice(0, 200) + "..." : "Schedule your private showing today."}

📍 More details + photos at link in bio

DM us or call to schedule a showing.

#austinrealestate #austinhomes #${listing.city?.toLowerCase().replace(/\s/g, "")}homes #newlisting #shapirogroup #${listing.zip ? `zip${listing.zip}` : "austintx"} #texasrealestate #homeforsale #luxuryrealestate #supersearch`;
}

function generateEmailBlast(listing: {
  address: string; city: string; zip: string | null;
  priceAmount: number | null; beds: number | null; baths: number | null;
  buildingSf: number | null; description: string | null; yearBuilt: number | null;
  imageUrl: string | null; id: string;
}): { subject: string; body: string } {
  const price = formatPrice(listing.priceAmount);
  const details = [
    listing.beds ? `${listing.beds} Beds` : null,
    listing.baths ? `${listing.baths} Baths` : null,
    listing.buildingSf ? `${listing.buildingSf.toLocaleString()} SF` : null,
    listing.yearBuilt ? `Built ${listing.yearBuilt}` : null,
  ].filter(Boolean).join(" · ");

  const subject = `New Listing: ${listing.address} — ${price}`;

  const body = `Just Listed: ${listing.address}

${listing.city}, TX ${listing.zip || ""} | ${price}
${details}

${listing.description || "Beautiful property now available. Schedule your showing today."}

View full details and photos: shapirogroup.co/listings/${listing.id}

---
Want to see this home in person? Reply to this email or text us to schedule a private showing.

${price} won't last long — the best homes in ${listing.city} are selling fast.

— The Shapiro Group Team
shapirogroup.co | SuperSearch: More listings than Zillow`;

  return { subject, body };
}

function generateListingFlyer(listing: {
  address: string; city: string; zip: string | null;
  priceAmount: number | null; beds: number | null; baths: number | null;
  buildingSf: number | null; lotSizeAcres: number | null;
  description: string | null; yearBuilt: number | null;
}): string {
  const price = formatPrice(listing.priceAmount);
  const details = [
    listing.beds ? `${listing.beds} Bedrooms` : null,
    listing.baths ? `${listing.baths} Bathrooms` : null,
    listing.buildingSf ? `${listing.buildingSf.toLocaleString()} Sq Ft` : null,
    listing.lotSizeAcres ? `${listing.lotSizeAcres} Acre Lot` : null,
    listing.yearBuilt ? `Built in ${listing.yearBuilt}` : null,
  ].filter(Boolean).join("\n");

  return `${listing.address}
${listing.city}, TX ${listing.zip || ""}

OFFERED AT ${price}

${details}

${listing.description || ""}

SHAPIRO GROUP
shapirogroup.co
Powered by SuperSearch — More listings than Zillow`;
}

function generateJustSoldPost(listing: {
  address: string; city: string; priceAmount: number | null;
  beds: number | null; baths: number | null;
}): string {
  const price = formatPrice(listing.priceAmount);
  return `🔑 JUST SOLD

${listing.address}
${listing.city}, TX

${price}

Another happy client, another successful close. Congrats to our buyers!

Thinking about buying or selling? Let's talk. DM us or visit shapirogroup.co

#justsold #austinrealestate #shapirogroup #closingday #realestateagent #austinhomes #homebuyers`;
}

function generateOpenHousePost(listing: {
  address: string; city: string; priceAmount: number | null;
  beds: number | null; baths: number | null; buildingSf: number | null;
}): string {
  const price = formatPrice(listing.priceAmount);
  const details = [
    listing.beds ? `${listing.beds} Bed` : null,
    listing.baths ? `${listing.baths} Bath` : null,
    listing.buildingSf ? `${listing.buildingSf.toLocaleString()} SF` : null,
  ].filter(Boolean).join(" | ");

  return `🏠 OPEN HOUSE THIS WEEKEND

${listing.address}
${listing.city}, TX

${price} | ${details}

📅 Saturday & Sunday, 1:00 - 4:00 PM

Come see this beautiful home in person. No appointment needed!

📍 Details + more photos: link in bio

#openhouse #austinrealestate #shapirogroup #homeforsale #openhouseweekend #austinhomes`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true, address: true, city: true, zip: true,
        priceAmount: true, beds: true, baths: true, buildingSf: true,
        lotSizeAcres: true, description: true, yearBuilt: true,
        propertyType: true, listingType: true, imageUrl: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const l = {
      ...listing,
      priceAmount: listing.priceAmount ? Number(listing.priceAmount) : null,
      buildingSf: listing.buildingSf ? Number(listing.buildingSf) : null,
      lotSizeAcres: listing.lotSizeAcres ? Number(listing.lotSizeAcres) : null,
    };

    const instagram = generateInstagramPost(l);
    const email = generateEmailBlast(l);
    const flyer = generateListingFlyer(l);
    const justSold = generateJustSoldPost(l);
    const openHouse = generateOpenHousePost(l);

    return NextResponse.json({
      listing: { id: l.id, address: l.address, city: l.city, imageUrl: l.imageUrl },
      content: {
        instagram,
        email,
        flyer,
        justSold,
        openHouse,
      },
    });
  } catch (e) {
    console.error("[marketing] Error:", e);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // For AI-enhanced content, redirect to ai-writer API
  const body = await req.json();
  const { listingId, contentType } = body;

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      address: true, city: true, zip: true,
      priceAmount: true, beds: true, baths: true,
      buildingSf: true, description: true, yearBuilt: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Forward to AI writer for enhanced content
  const details: Record<string, string> = {
    address: listing.address,
    neighborhood: `${listing.city}, TX ${listing.zip || ""}`,
    price: formatPrice(listing.priceAmount ? Number(listing.priceAmount) : null),
    beds: listing.beds?.toString() || "",
    baths: listing.baths?.toString() || "",
    sqft: listing.buildingSf?.toString() || "",
    yearBuilt: listing.yearBuilt?.toString() || "",
    notes: listing.description || "",
  };

  if (contentType === "social_post") {
    details.postType = "New Listing";
    details.highlight = listing.description?.slice(0, 100) || "";
  }

  try {
    const aiRes = await fetch(new URL("/api/portal/ai-writer", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") || "" },
      body: JSON.stringify({
        type: contentType || "listing_description",
        details,
      }),
    });

    if (aiRes.ok) {
      return NextResponse.json(await aiRes.json());
    }
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  } catch (e) {
    console.error("[marketing] AI error:", e);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
