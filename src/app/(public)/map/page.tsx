import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Austin Property Map | SuperSearch | Shapiro Group",
  description: "Interactive map of all Austin properties for sale. Explore neighborhoods, compare prices, and find off-market listings with SuperSearch.",
};

// Redirect to search with map view focused
export default function MapPage() {
  return (
    <meta httpEquiv="refresh" content="0; url=/search?searchMode=residential" />
  );
}
