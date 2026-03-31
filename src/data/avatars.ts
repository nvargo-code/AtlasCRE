/**
 * Buyer Avatars — Target personas for content and marketing.
 *
 * These drive neighborhood recommendations, search suggestions,
 * email content, and ad targeting across the platform.
 */

export interface BuyerAvatar {
  id: string;
  name: string;
  tagline: string;
  age: string;
  income: string;
  description: string;
  priorities: string[];
  dealBreakers: string[];
  neighborhoodFit: Record<string, number>; // slug -> 1-5 fit score
  searchBehavior: {
    priceRange: [number, number];
    minBeds: number;
    propertyTypes: string[];
    keywords: string[];
  };
}

export const BUYER_AVATARS: BuyerAvatar[] = [
  {
    id: "tech-founder",
    name: "The Tech Founder",
    tagline: "Sold a company or building one. Wants to live where the energy is.",
    age: "30-42",
    income: "$300K-$2M+",
    description:
      "Recently exited a startup, raised a Series B, or running a profitable SaaS company. Works from home or a coworking space. Values walkability, proximity to other founders, great coffee, and a home office setup. Doesn't want a suburb — wants an urban or semi-urban neighborhood with character. Probably drives a Tesla or a Rivian. Eats at Uchi, drinks at Drink.Well, and gets a cold plunge before 7am.",
    priorities: [
      "Walkable to restaurants, coffee, coworking",
      "Fast fiber internet",
      "Home office or flex space",
      "Proximity to other entrepreneurs / tech scene",
      "Modern or updated finishes",
      "Investment upside / appreciation potential",
    ],
    dealBreakers: [
      "HOA-heavy communities with strict rules",
      "Long commute to downtown (if they ever go)",
      "Cookie-cutter suburban developments",
      "Flood zones or foundation issues",
    ],
    neighborhoodFit: {
      downtown: 5,
      "78704": 5,
      "east-side": 5,
      westlake: 3,
      riverside: 4,
      "78745": 3,
      "78731": 2,
      "78723": 4,
    },
    searchBehavior: {
      priceRange: [500000, 2000000],
      minBeds: 2,
      propertyTypes: ["Single Family", "Condo", "Townhouse"],
      keywords: ["modern", "updated", "walkable", "downtown", "home office"],
    },
  },
  {
    id: "biohacker-exec",
    name: "The Optimization Executive",
    tagline: "Tracks everything. Optimizes everything. Including where they live.",
    age: "32-48",
    income: "$250K-$1M+",
    description:
      "VP or C-suite at a tech company, or a high-performing consultant/investor. Morning routine involves cold plunge, sauna, a workout, and Mud\\Wtr before the first meeting. Wears a Whoop or Oura ring. Has strong opinions about air quality, water filtration, and circadian lighting. Wants a house that supports their lifestyle — garage gym space, outdoor area for cold plunge, proximity to premium fitness facilities. May also be into functional medicine, float tanks, or IV therapy. Eats clean, shops at Whole Foods or local farms.",
    priorities: [
      "Space for home gym / cold plunge / sauna setup",
      "Proximity to premium gyms (CrossFit, F45, Equinox, boutique)",
      "Clean air, good water, low EMF (yes, really)",
      "Outdoor space — yard, pool, or greenbelt access",
      "High-end grocery (Whole Foods, farmers markets)",
      "Good natural light and quiet streets",
      "Access to functional medicine / wellness clinics",
    ],
    dealBreakers: [
      "Tiny yard or no outdoor space",
      "Near highway / high traffic / poor air quality",
      "No garage or space for equipment",
      "Neighborhoods without fitness options nearby",
    ],
    neighborhoodFit: {
      downtown: 3,
      "78704": 4,
      "east-side": 3,
      westlake: 5,
      riverside: 2,
      "78745": 3,
      "78731": 4,
      "78723": 3,
    },
    searchBehavior: {
      priceRange: [600000, 3000000],
      minBeds: 3,
      propertyTypes: ["Single Family"],
      keywords: ["pool", "garage", "yard", "greenbelt", "quiet", "hill country"],
    },
  },
  {
    id: "young-family",
    name: "The Ambitious Family",
    tagline: "Building a career and raising kids who'll change the world.",
    age: "30-42",
    income: "$200K-$800K",
    description:
      "Dual-income couple (often one in tech, one in professional services) with 1-3 kids under 10. Schools are non-negotiable — they've researched every campus rating and are willing to pay the premium for Eanes ISD or a top-rated charter. Want safe streets their kids can ride bikes on, a good park within walking distance, and restaurants that won't side-eye a toddler. Value community — the kind of neighborhood where you know your neighbors. Weekend farmers market, youth sports leagues, and family-friendly hikes.",
    priorities: [
      "Top-rated schools (Eanes ISD, Lake Travis ISD, or top charters)",
      "Safe, walkable streets with sidewalks",
      "Parks and playgrounds within walking distance",
      "Family-friendly restaurants and activities",
      "Strong sense of community / neighborhood events",
      "4+ bedrooms, good yard, functional floor plan",
      "Low crime, good property value trajectory",
    ],
    dealBreakers: [
      "Poorly rated schools / no school options",
      "High crime areas",
      "No yard or outdoor play space",
      "Highway-adjacent / unsafe for kids",
      "Party neighborhoods (Rainey Street, 6th Street proximity)",
    ],
    neighborhoodFit: {
      downtown: 1,
      "78704": 3,
      "east-side": 2,
      westlake: 5,
      riverside: 2,
      "78745": 4,
      "78731": 5,
      "78723": 4,
    },
    searchBehavior: {
      priceRange: [450000, 1500000],
      minBeds: 4,
      propertyTypes: ["Single Family"],
      keywords: ["family", "schools", "yard", "cul-de-sac", "safe", "pool"],
    },
  },
  {
    id: "investor",
    name: "The Portfolio Builder",
    tagline: "Sees real estate as an asset class, not just a place to live.",
    age: "28-55",
    income: "$150K-$1M+",
    description:
      "May live in Austin or be buying remotely. Evaluates properties on cap rate, cash-on-cash return, and appreciation potential. Often looking for value-add opportunities — outdated properties in appreciating neighborhoods that can be renovated and rented or flipped. Wants data, not stories. Interested in multi-family, ADU potential, short-term rental feasibility, and zoning flexibility. May already own 2-10 properties.",
    priorities: [
      "Cap rate and cash flow analysis",
      "Appreciation trajectory of the neighborhood",
      "ADU / short-term rental regulations",
      "Value-add / renovation opportunities",
      "Proximity to employment centers (UT, downtown, Domain)",
      "Low vacancy rates and strong rental demand",
    ],
    dealBreakers: [
      "Flat or declining appreciation",
      "STR-restricted zones (if that's the play)",
      "Foundation issues or major structural problems",
      "Overpriced for the rental market",
    ],
    neighborhoodFit: {
      downtown: 3,
      "78704": 4,
      "east-side": 5,
      westlake: 2,
      riverside: 5,
      "78745": 4,
      "78731": 3,
      "78723": 5,
    },
    searchBehavior: {
      priceRange: [200000, 1000000],
      minBeds: 2,
      propertyTypes: ["Single Family", "Multi-Family", "Condo"],
      keywords: ["investment", "rental", "ADU", "duplex", "value-add", "fixer"],
    },
  },
];
