import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ListingDetailClient } from "@/components/public/ListingDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { address: true, city: true, state: true, priceAmount: true, propertyType: true, beds: true, baths: true },
  });

  if (!listing) return { title: "Listing Not Found | Shapiro Group" };

  const price = listing.priceAmount
    ? `$${listing.priceAmount.toLocaleString()}`
    : "";
  const details = [listing.beds && `${listing.beds}bd`, listing.baths && `${listing.baths}ba`]
    .filter(Boolean)
    .join("/");

  return {
    title: `${listing.address}, ${listing.city} ${price ? `| ${price}` : ""} | Shapiro Group`,
    description: `${listing.address}, ${listing.city}, ${listing.state}. ${price} ${details}. ${listing.propertyType}. View details, photos, and schedule a showing with Shapiro Group.`,
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      variants: {
        include: { source: { select: { name: true, slug: true } } },
        orderBy: { fetchedAt: "desc" },
      },
      photos: {
        orderBy: { position: "asc" },
        select: { url: true },
      },
    },
  });

  if (!listing) notFound();

  // Find similar listings (same city, similar price, same search mode)
  let similarListings: { id: string; address: string; city: string; priceAmount: number | null; beds: number | null; baths: number | null; buildingSf: number | null; imageUrl: string | null; listingType: string; propSubType: string | null }[] = [];
  try {
    const priceAmount = listing.priceAmount ? Number(listing.priceAmount) : null;
    const raw = await prisma.listing.findMany({
      where: {
        id: { not: listing.id },
        status: "active",
        searchMode: listing.searchMode,
        city: listing.city,
        ...(priceAmount && {
          priceAmount: {
            gte: priceAmount * 0.7,
            lte: priceAmount * 1.3,
          },
        }),
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true, address: true, city: true, priceAmount: true,
        beds: true, baths: true, buildingSf: true, imageUrl: true,
        listingType: true, propSubType: true,
      },
    });
    similarListings = raw.map((l) => ({ ...l, priceAmount: l.priceAmount ? Number(l.priceAmount) : null }));
  } catch {
    // Non-critical
  }

  const serialized = {
    ...listing,
    priceAmount: listing.priceAmount ? Number(listing.priceAmount) : null,
    lotSizeAcres: listing.lotSizeAcres ? Number(listing.lotSizeAcres) : null,
    lat: Number(listing.lat),
    lng: Number(listing.lng),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    variants: listing.variants.map((v) => ({
      id: v.id,
      sourceName: v.source.name,
      sourceSlug: v.source.slug,
      externalId: v.externalId,
      sourceUrl: v.sourceUrl,
      priceAmount: v.priceAmount ? Number(v.priceAmount) : null,
      priceUnit: v.priceUnit,
      buildingSf: v.buildingSf,
      description: v.description,
      brokerName: v.brokerName,
      brokerPhone: v.brokerPhone,
      brokerEmail: v.brokerEmail,
      imageUrl: v.imageUrl,
      fetchedAt: v.fetchedAt.toISOString(),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: `${listing.address}, ${listing.city}`,
            description: listing.description || `Property for ${listing.listingType} at ${listing.address}, ${listing.city}, ${listing.state}`,
            url: `https://shapirogroup.co/listings/${listing.id}`,
            ...(serialized.priceAmount && {
              offers: {
                "@type": "Offer",
                price: serialized.priceAmount,
                priceCurrency: "USD",
              },
            }),
            address: {
              "@type": "PostalAddress",
              streetAddress: listing.address,
              addressLocality: listing.city,
              addressRegion: listing.state,
              postalCode: listing.zip,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: listing.lat,
              longitude: listing.lng,
            },
            ...(listing.imageUrl && { image: listing.imageUrl }),
            ...(listing.beds && { numberOfBedrooms: listing.beds }),
            ...(listing.baths && { numberOfBathroomsTotal: listing.baths }),
            ...(listing.buildingSf && { floorSize: { "@type": "QuantitativeValue", value: listing.buildingSf, unitCode: "FTK" } }),
          }),
        }}
      />

      {/* Breadcrumb */}
      <div className="pt-24 pb-4 bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex items-center gap-2 text-[12px] text-mid-gray">
            <Link href="/" className="hover:text-navy transition-colors">Home</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-navy transition-colors">SuperSearch</Link>
            <span>/</span>
            <span className="text-navy">{listing.address}</span>
          </div>
        </div>
      </div>

      <ListingDetailClient listing={serialized} similarListings={similarListings} />
    </>
  );
}
