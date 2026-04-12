import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Fix lease priceUnit
  const r1 = await prisma.listing.updateMany({
    where: { listingType: { in: ["lease", "Lease", "For Lease"] }, priceUnit: "total" },
    data: { priceUnit: "per_month" },
  });
  console.log("Fixed priceUnit to per_month:", r1.count, "listings");

  // Normalize listingType to lowercase
  const r2 = await prisma.listing.updateMany({
    where: { listingType: { in: ["For Sale", "Sale"] } },
    data: { listingType: "sale" },
  });
  console.log("Normalized to 'sale':", r2.count, "listings");

  const r3 = await prisma.listing.updateMany({
    where: { listingType: { in: ["For Lease", "Lease"] } },
    data: { listingType: "lease" },
  });
  console.log("Normalized to 'lease':", r3.count, "listings");

  // Verify
  const types = await prisma.listing.groupBy({ by: ["listingType"], _count: true });
  console.log("\nFinal listingType distribution:", types);

  await prisma.$disconnect();
}

main().catch(console.error);
