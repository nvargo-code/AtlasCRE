import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Property Listing | Shapiro Group";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      address: true, city: true, state: true, zip: true,
      priceAmount: true, beds: true, baths: true, buildingSf: true,
      propertyType: true, propSubType: true, listingType: true,
    },
  });

  if (!listing) {
    return new ImageResponse(
      (<div style={{ background: "#0A1628", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32 }}>Listing Not Found</div>),
      { ...size }
    );
  }

  const price = listing.priceAmount
    ? listing.priceAmount >= 1000000
      ? `$${(Number(listing.priceAmount) / 1000000).toFixed(1)}M`
      : `$${Number(listing.priceAmount).toLocaleString()}`
    : "Contact for Price";

  const details = [
    listing.beds ? `${listing.beds} Beds` : null,
    listing.baths ? `${listing.baths} Baths` : null,
    listing.buildingSf ? `${Number(listing.buildingSf).toLocaleString()} SF` : null,
  ].filter(Boolean).join("  ·  ");

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A1628",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top — For Sale badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ background: "#C9A96E", color: "#fff", padding: "6px 16px", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em" }}>
            FOR {listing.listingType.toUpperCase()}
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 600, letterSpacing: "0.1em" }}>
            {listing.propSubType || listing.propertyType}
          </span>
        </div>

        {/* Middle — Price and address */}
        <div>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>
            {price}
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
            {listing.address}
          </div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.4)" }}>
            {listing.city}, {listing.state} {listing.zip}
          </div>
          {details && (
            <div style={{ fontSize: 20, color: "#C9A96E", marginTop: 16, fontWeight: 600 }}>
              {details}
            </div>
          )}
        </div>

        {/* Bottom — Branding */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", letterSpacing: "0.06em" }}>SHAPIRO</span>
            <span style={{ fontSize: 24, fontWeight: 300, color: "#C9A96E", letterSpacing: "0.06em" }}>GROUP</span>
          </div>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.1em" }}>
            SUPERSEARCH — MORE LISTINGS THAN ZILLOW
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
