interface ListingBadgeProps {
  status: string;
  listingType: string;
}

const badgeConfig: Record<string, { label: string; bg: string; text: string }> = {
  "coming_soon": { label: "Coming Soon", bg: "bg-navy", text: "text-white" },
  "pending": { label: "Pending", bg: "bg-navy/70", text: "text-white" },
  "sold": { label: "Just Sold", bg: "bg-charcoal", text: "text-white" },
  "price_reduced": { label: "Price Reduced", bg: "bg-red-600", text: "text-white" },
  "open_house": { label: "Open House", bg: "bg-gold", text: "text-white" },
  "new": { label: "New Listing", bg: "bg-gold", text: "text-white" },
};

export function ListingBadge({ status, listingType }: ListingBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const config = badgeConfig[normalized];

  // Default to showing the listing type
  const bg = config?.bg || "bg-gold";
  const text = config?.text || "text-white";
  const label = config?.label || listingType;

  return (
    <span className={`${bg} ${text} text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1`}>
      {label}
    </span>
  );
}
