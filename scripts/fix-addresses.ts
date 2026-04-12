import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/** Common street suffix mappings for deduplication */
const SUFFIX_ABBREVS: Record<string, string> = {
  lane: "Ln", ln: "Ln",
  road: "Rd", rd: "Rd",
  drive: "Dr", dr: "Dr",
  street: "St", st: "St",
  avenue: "Ave", ave: "Ave",
  boulevard: "Blvd", blvd: "Blvd",
  circle: "Cir", cir: "Cir",
  court: "Ct", ct: "Ct",
  place: "Pl", pl: "Pl",
  trail: "Trl", trl: "Trl",
  way: "Way",
  parkway: "Pkwy", pkwy: "Pkwy",
  terrace: "Ter", ter: "Ter",
  loop: "Loop",
  pass: "Pass",
  path: "Path",
  run: "Run",
  cove: "Cv", cv: "Cv",
  crossing: "Xing", xing: "Xing",
  highway: "Hwy", hwy: "Hwy",
  bend: "Bend",
  hill: "Hill",
  ridge: "Ridge",
  glen: "Glen",
  hollow: "Holw", holw: "Holw",
  point: "Pt", pt: "Pt",
};

function cleanAddress(raw: string): string {
  // Remove "None" (case-insensitive, standalone word)
  let addr = raw.replace(/\bNone\b/gi, "").replace(/\s{2,}/g, " ").trim();

  // Deduplicate consecutive identical words (e.g., "Ln Ln" -> "Ln")
  addr = addr.replace(/\b(\w+)\s+\1\b/gi, "$1");

  // Deduplicate suffix variants (e.g., "Road Rd" -> "Rd", "Lane Ln" -> "Ln")
  const words = addr.split(/\s+/);
  const cleaned: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    const wordNorm = SUFFIX_ABBREVS[word.toLowerCase()];
    const nextNorm = nextWord ? SUFFIX_ABBREVS[nextWord.toLowerCase()] : undefined;
    if (wordNorm && nextNorm && wordNorm === nextNorm) {
      continue;
    }
    cleaned.push(word);
  }
  return cleaned.join(" ").trim();
}

async function main() {
  console.log("Scanning listings for address quality issues...");

  // Find listings with "None" in address or duplicate suffixes
  const listings = await prisma.listing.findMany({
    where: {
      OR: [
        { address: { contains: "None" } },
        { address: { contains: " Ln Ln" } },
        { address: { contains: " Rd Rd" } },
        { address: { contains: " Dr Dr" } },
        { address: { contains: " St St" } },
        { address: { contains: " Ave Ave" } },
        { address: { contains: " Blvd Blvd" } },
        { address: { contains: " Ct Ct" } },
        { address: { contains: " Cir Cir" } },
        { address: { contains: " Pl Pl" } },
        { address: { contains: " Trl Trl" } },
        { address: { contains: "Road Rd" } },
        { address: { contains: "Lane Ln" } },
        { address: { contains: "Drive Dr" } },
        { address: { contains: "Street St" } },
        { address: { contains: "Avenue Ave" } },
      ],
    },
    select: { id: true, address: true },
  });

  console.log(`Found ${listings.length} listings with address issues.`);

  let fixed = 0;
  for (const listing of listings) {
    const cleaned = cleanAddress(listing.address);
    if (cleaned !== listing.address) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { address: cleaned },
      });
      console.log(`  Fixed: "${listing.address}" -> "${cleaned}"`);
      fixed++;
    }
  }

  console.log(`\nDone. Fixed ${fixed} listing addresses.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
