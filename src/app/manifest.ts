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
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
