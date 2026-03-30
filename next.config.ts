import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shapirore.com",
      },
    ],
  },
  async redirects() {
    return [
      // austinloves.me path redirects (when domain is pointed here)
      { source: "/buyers/properties", destination: "/search?searchMode=residential", permanent: true },
      { source: "/buyers/open-houses", destination: "/search?searchMode=residential", permanent: true },
      { source: "/buyers/dream-home-finder", destination: "/find", permanent: true },
      { source: "/sellers/selling-your-home", destination: "/sell", permanent: true },
      { source: "/sellers/home-valuation", destination: "/valuation", permanent: true },
      { source: "/sellers/sold-properties", destination: "/search", permanent: true },
      { source: "/sellers/sellers-guide", destination: "/sell", permanent: true },
      { source: "/our-story", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/corporate-leadership", destination: "/team", permanent: true },
      // shapirore.com path redirects
      { source: "/list-with-us", destination: "/sell", permanent: true },
      { source: "/buy-with-us", destination: "/buy", permanent: true },
      { source: "/testimonials", destination: "/team", permanent: true },
      { source: "/newsletter", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
