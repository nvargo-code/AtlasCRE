import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: "default-tenant" },
    create: { id: "default-tenant", name: "AtlasCRE" },
    update: {},
  });
  console.log("Tenant:", tenant.name);

  // Create admin user
  const passwordHash = await hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@atlascre.com" },
    create: {
      email: "admin@atlascre.com",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      tenantId: tenant.id,
    },
    update: {},
  });
  console.log("User:", user.email, "(role:", user.role + ")");

  // Create listing sources
  const sources = [
    { slug: "crexi",           name: "Crexi",                enabled: true  },
    { slug: "realtor",         name: "Realtor.com",           enabled: true  },
    { slug: "aln",             name: "Austin Luxury Network", enabled: true  },
    { slug: "loopnet",         name: "LoopNet",               enabled: false },
    { slug: "davisonvogel",    name: "Davison & Vogel",       enabled: false },
    { slug: "youngerpartners", name: "Younger Partners",      enabled: false },
  ];

  for (const s of sources) {
    await prisma.listingSource.upsert({
      where: { slug: s.slug },
      create: s,
      update: { enabled: s.enabled },
    });
  }
  console.log("Created", sources.length, "listing sources");

  await (prisma as unknown as { $disconnect: () => Promise<void> }).$disconnect();
}

main().catch(console.error);
