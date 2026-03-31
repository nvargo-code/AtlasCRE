import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://shapirogroup.co"),
  title: "Shapiro Group | Austin Luxury Real Estate",
  description:
    "Austin's most comprehensive property search. SuperSearch finds more listings than Zillow. Shapiro Group — informed real estate decisions.",
  keywords: [
    "Austin real estate",
    "Austin luxury homes",
    "Austin realtor",
    "Shapiro Group",
    "SuperSearch",
    "Austin homes for sale",
  ],
  openGraph: {
    title: "Shapiro Group | Austin Luxury Real Estate",
    description:
      "SuperSearch finds more listings than Zillow. Informed real estate decisions in Austin, TX.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${geistMono.variable} antialiased bg-white text-navy`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
