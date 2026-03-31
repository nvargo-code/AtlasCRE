import type { Metadata } from "next";
import { PublicSearchClient } from "@/components/public/PublicSearchClient";

export const metadata: Metadata = {
  title: "SuperSearch | Find More Listings Than Zillow | Shapiro Group",
  description:
    "SuperSearch aggregates listings from MLS, off-market databases, and broker-exclusive sources. See more properties than Zillow, Realtor.com, or any other portal.",
};

export default function SearchPage() {
  return <PublicSearchClient />;
}
