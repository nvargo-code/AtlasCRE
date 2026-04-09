import Link from "next/link";
import { getSourceTag } from "@/lib/source-tags";

interface ListingCardProps {
  id: string;
  address: string;
  city: string;
  priceAmount: number | null;
  priceUnit?: string | null;
  beds?: number | null;
  baths?: number | null;
  buildingSf?: number | null;
  propertyType?: string;
  propSubType?: string | null;
  imageUrl?: string | null;
  listingType: string;
  featured?: boolean;
  sources?: string[];
}

export function ListingCard({
  id,
  address,
  city,
  priceAmount,
  listingType,
  beds,
  baths,
  buildingSf,
  imageUrl,
  featured,
  sources,
}: ListingCardProps) {
  return (
    <Link
      href={`/listings/${id}`}
      className="group bg-white overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div
        className={`${featured ? "aspect-[16/9]" : "aspect-[4/3]"} bg-navy/5 relative overflow-hidden img-zoom`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-navy/5">
            <svg
              className="w-12 h-12 text-navy/10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
          {listingType}
        </span>
        {sources && sources.length > 0 && (
          <div className="absolute top-3 right-3 flex gap-1">
            {sources.map((slug) => {
              const tag = getSourceTag(slug);
              return (
                <span key={slug} className={`text-[9px] font-semibold tracking-wider uppercase ${tag.bg} ${tag.text} px-1.5 py-0.5 backdrop-blur-sm`}>
                  {tag.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-lg font-semibold text-navy group-hover:text-gold transition-colors mb-1">
          {priceAmount ? `$${priceAmount.toLocaleString()}` : "Contact for Price"}
        </p>
        <p className="text-sm text-navy/70 mb-2 truncate">{address}</p>
        <p className="text-[12px] text-mid-gray mb-2">{city}</p>
        <div className="flex items-center gap-3 text-[12px] text-mid-gray">
          {beds && <span>{beds} bed</span>}
          {baths && <span>{baths} bath</span>}
          {buildingSf && <span>{buildingSf.toLocaleString()} SF</span>}
        </div>
      </div>
    </Link>
  );
}
