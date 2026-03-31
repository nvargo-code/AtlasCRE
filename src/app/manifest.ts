import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shapiro Group | Austin Real Estate",
    short_name: "Shapiro Group",
    description: "Austin's most comprehensive property search. SuperSearch finds more listings than Zillow.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A1628",
    theme_color: "#C9A96E",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
