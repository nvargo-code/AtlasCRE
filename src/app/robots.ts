import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://shapirogroup.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api/", "/favorites", "/saved-searches"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
