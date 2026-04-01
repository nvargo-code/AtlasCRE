"use client";

import Link from "next/link";
import { RevealSection } from "./RevealSection";
import { MortgageCalculator } from "./MortgageCalculator";
import { ShareButtons } from "./ShareButtons";
import { ListingMap } from "./ListingMap";
import { ImageGallery } from "./ImageGallery";
import { ListingActions } from "./ListingActions";
import { OfferEstimator } from "./OfferEstimator";
import { CommuteCalculator } from "./CommuteCalculator";
import { NearbyAmenities } from "./NearbyAmenities";
import { PriceHistory } from "./PriceHistory";
import { addToRecentlyViewed } from "./RecentlyViewed";
import { useEffect } from "react";

interface ListingData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  lat: number;
  lng: number;
  propertyType: string;
  listingType: string;
  priceAmount: number | null;
  priceUnit: string | null;
  buildingSf: number | null;
  lotSizeAcres: number | null;
  yearBuilt: number | null;
  brokerName: string | null;
  brokerCompany: string | null;
  description: string | null;
  imageUrl: string | null;
  beds: number | null;
  baths: number | null;
  garageSpaces: number | null;
  stories: number | null;
  propSubType: string | null;
  searchMode: string;
  createdAt?: string;
  variants: {
    id: string;
    sourceName: string;
    sourceSlug: string;
    externalId: string;
    sourceUrl: string | null;
    priceAmount: number | null;
    priceUnit: string | null;
    buildingSf: number | null;
    description: string | null;
    brokerName: string | null;
    brokerPhone: string | null;
    brokerEmail: string | null;
    imageUrl: string | null;
    fetchedAt: string;
  }[];
}

function formatPrice(amount: number | null, unit: string | null): string {
  if (!amount) return "Contact for Price";
  const formatted =
    amount >= 1000000
      ? `$${(amount / 1000000).toFixed(1)}M`
      : `$${amount.toLocaleString()}`;
  if (unit === "per_sf_yr") return `${formatted}/SF/YR`;
  if (unit === "per_sf_mo") return `${formatted}/SF/MO`;
  if (unit === "per_sf") return `${formatted}/SF`;
  return formatted;
}

interface SimilarListing {
  id: string;
  address: string;
  city: string;
  priceAmount: number | null;
  beds: number | null;
  baths: number | null;
  buildingSf: number | null;
  imageUrl: string | null;
  listingType: string;
  propSubType: string | null;
}

export function ListingDetailClient({ listing, similarListings = [] }: { listing: ListingData; similarListings?: SimilarListing[] }) {
  useEffect(() => {
    addToRecentlyViewed({
      id: listing.id,
      address: listing.address,
      city: listing.city,
      price: listing.priceAmount ? `$${listing.priceAmount.toLocaleString()}` : "N/A",
    });
  }, [listing.id, listing.address, listing.city, listing.priceAmount]);

  const details = [
    listing.beds && { label: "Bedrooms", value: listing.beds },
    listing.baths && { label: "Bathrooms", value: listing.baths },
    listing.buildingSf && {
      label: "Square Feet",
      value: listing.buildingSf.toLocaleString(),
    },
    listing.lotSizeAcres && {
      label: "Lot Size",
      value: `${listing.lotSizeAcres} acres`,
    },
    listing.yearBuilt && { label: "Year Built", value: listing.yearBuilt },
    listing.garageSpaces && {
      label: "Garage",
      value: `${listing.garageSpaces} car`,
    },
    listing.stories && { label: "Stories", value: listing.stories },
    { label: "Type", value: listing.propSubType || listing.propertyType },
    { label: "Status", value: listing.listingType },
  ].filter(Boolean) as { label: string; value: string | number }[];

  return (
    <>
      {/* Hero section */}
      <section className="bg-warm-gray pb-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          {/* Image gallery */}
          <div className="mb-8">
            <ImageGallery
              images={[...new Set([
                listing.imageUrl,
                ...listing.variants.map((v) => v.imageUrl),
              ].filter((url): url is string => !!url))]}
              address={listing.address}
            />
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-12">
            {/* Main info */}
            <div>
              <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-semibold text-navy mb-2">
                    {formatPrice(listing.priceAmount, listing.priceUnit)}
                  </h1>
                  <p className="text-lg text-navy/70">
                    {listing.address}
                  </p>
                  <p className="text-mid-gray">
                    {listing.city}, {listing.state} {listing.zip}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ShareButtons
                    url={`/listings/${listing.id}`}
                    title={`${listing.address}, ${listing.city} | Shapiro Group`}
                  />
                  <a
                    href={`/listings/${listing.id}/print`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center bg-warm-gray hover:bg-navy/10 transition-colors group"
                    title="Print / PDF"
                  >
                    <svg className="w-4 h-4 text-mid-gray group-hover:text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </a>
                  <span className="text-[12px] font-semibold tracking-[0.12em] uppercase bg-gold/10 text-gold px-4 py-1.5">
                    For {listing.listingType}
                  </span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-6 py-6 border-y border-navy/10">
                {listing.beds && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-navy">{listing.beds}</p>
                    <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-mid-gray">Beds</p>
                  </div>
                )}
                {listing.baths && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-navy">{listing.baths}</p>
                    <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-mid-gray">Baths</p>
                  </div>
                )}
                {listing.buildingSf && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-navy">{listing.buildingSf.toLocaleString()}</p>
                    <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-mid-gray">Sq Ft</p>
                  </div>
                )}
                {listing.yearBuilt && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-navy">{listing.yearBuilt}</p>
                    <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-mid-gray">Year Built</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action card — showing, save, message, collection */}
            <ListingActions
              listingId={listing.id}
              address={listing.address}
              city={listing.city}
            />
          </div>
        </div>
      </section>

      {/* Details */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12">
            <div>
              {/* Description */}
              {listing.description && (
                <div className="mb-12">
                  <h2 className="text-xl font-semibold text-navy mb-4">Description</h2>
                  <p className="text-navy/70 text-base leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Property details grid */}
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-navy mb-6">Property Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                  {details.map((d) => (
                    <div key={d.label} className="py-3 border-b border-navy/5">
                      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-1">
                        {d.label}
                      </p>
                      <p className="text-navy font-medium">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broker info */}
              {(listing.brokerName || listing.brokerCompany) && (
                <div className="mb-12">
                  <h2 className="text-xl font-semibold text-navy mb-4">Listing Broker</h2>
                  <div className="bg-warm-gray p-6">
                    {listing.brokerName && (
                      <p className="text-navy font-medium">{listing.brokerName}</p>
                    )}
                    {listing.brokerCompany && (
                      <p className="text-mid-gray text-sm mt-1">{listing.brokerCompany}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Sources */}
              {listing.variants.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-navy mb-4">
                    Found on {listing.variants.length} Source{listing.variants.length > 1 ? "s" : ""}
                  </h2>
                  <div className="space-y-2">
                    {listing.variants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-4 bg-warm-gray"
                      >
                        <div>
                          <p className="text-navy font-medium">{v.sourceName}</p>
                          {v.brokerName && (
                            <p className="text-mid-gray text-sm mt-0.5">
                              Listed by {v.brokerName}
                            </p>
                          )}
                        </div>
                        {v.sourceUrl && (
                          <a
                            href={v.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark transition-colors"
                          >
                            View Source &rarr;
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar placeholder for map or similar listings */}
            <div>
              <div className="sticky top-24">
                <div className="mb-6 overflow-hidden">
                  <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mid-gray mb-3 px-1">
                    Location
                  </h3>
                  <ListingMap lat={listing.lat} lng={listing.lng} address={listing.address} />
                  <div className="bg-warm-gray p-4">
                    <p className="text-sm text-navy">
                      {listing.address}<br />
                      {listing.city}, {listing.state} {listing.zip}
                    </p>
                  </div>
                </div>

                {/* Offer Estimator */}
                {listing.priceAmount && (
                  <OfferEstimator
                    listingId={listing.id}
                    listPrice={listing.priceAmount}
                    address={listing.address}
                    zip={listing.zip}
                    daysOnMarket={Math.floor((Date.now() - new Date(listing.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}
                  />
                )}

                {/* Mortgage Calculator */}
                {listing.priceAmount && listing.searchMode === "residential" && (
                  <MortgageCalculator listPrice={listing.priceAmount} />
                )}

                {/* Commute Calculator */}
                <CommuteCalculator
                  listingAddress={listing.address}
                  listingCity={listing.city}
                  lat={listing.lat}
                  lng={listing.lng}
                />

                {/* Nearby Amenities */}
                <NearbyAmenities zip={listing.zip} city={listing.city} />

                {/* Price History */}
                <PriceHistory
                  listingId={listing.id}
                  currentPrice={listing.priceAmount}
                  listedDate={listing.createdAt || null}
                />

                <div className="bg-navy p-6 text-center">
                  <p className="text-white font-semibold mb-2">Find Similar Properties</p>
                  <p className="text-white/50 text-sm mb-4">
                    SuperSearch finds more listings than Zillow
                  </p>
                  <Link
                    href={`/search?searchMode=${listing.searchMode}&q=${encodeURIComponent(listing.city)}`}
                    className="btn-primary w-full text-center"
                  >
                    Search {listing.city}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Similar listings */}
      {similarListings.length > 0 && (
        <RevealSection className="section-padding bg-warm-gray">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-light">
                Similar <span className="font-semibold">Properties</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarListings.map((sim) => (
                <Link
                  key={sim.id}
                  href={`/listings/${sim.id}`}
                  className="group bg-white overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                    {sim.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sim.imageUrl} alt={sim.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-navy/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
                      {sim.listingType}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-base font-semibold text-navy group-hover:text-gold transition-colors mb-1">
                      {sim.priceAmount ? `$${sim.priceAmount.toLocaleString()}` : "Contact"}
                    </p>
                    <p className="text-sm text-navy/70 truncate">{sim.address}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-mid-gray">
                      {sim.beds && <span>{sim.beds} bd</span>}
                      {sim.baths && <span>{sim.baths} ba</span>}
                      {sim.buildingSf && <span>{sim.buildingSf.toLocaleString()} SF</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </RevealSection>
      )}
    </>
  );
}
