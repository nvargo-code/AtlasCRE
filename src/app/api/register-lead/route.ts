import { NextResponse } from "next/server";
import { pushLeadToGHL, buildLeadTags, buildCustomFields } from "@/lib/ghl";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const data = await request.json();

  console.log("[Lead Registration]", data.email, "source:", data.source);

  // Push to GoHighLevel CRM
  const tags = buildLeadTags({
    type: data.type || "buyer",
    searchMode: data.searchMode,
    priceMax: data.priceMax ? Number(data.priceMax) : undefined,
    neighborhoods: data.neighborhoods,
    bedsMin: data.bedsMin ? Number(data.bedsMin) : undefined,
    source: data.source || "supersearch_gate",
  });

  tags.push("website", "supersearch_lead");

  const customFields = buildCustomFields({
    searchMode: data.searchMode,
    priceRange: data.priceRange,
    neighborhoods: data.neighborhoods,
    bedsMin: data.bedsMin ? Number(data.bedsMin) : undefined,
    bathsMin: data.bathsMin ? Number(data.bathsMin) : undefined,
    searchQuery: data.searchQuery,
  });

  if (data.context) customFields.lead_context = data.context;
  if (data.timeline) customFields.timeline = data.timeline;
  if (data.propertyType) customFields.property_type = data.propertyType;

  await pushLeadToGHL({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    source: data.source || "supersearch_gate",
    tags,
    customFields,
  });

  // Auto-create user + saved search for DreamHomeFinder submissions
  if (data.source === "dream_home_finder" && data.email) {
    try {
      // Find or create user
      let user = await prisma.user.findUnique({ where: { email: data.email } });

      if (!user) {
        // Get or create default tenant
        let tenant = await prisma.tenant.findFirst();
        if (!tenant) {
          tenant = await prisma.tenant.create({ data: { name: "Shapiro Group" } });
        }

        const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
        user = await prisma.user.create({
          data: {
            email: data.email,
            name: data.firstName ? `${data.firstName} ${data.lastName || ""}`.trim() : null,
            phone: data.phone || null,
            passwordHash,
            tenantId: tenant.id,
            role: "USER",
          },
        });
      }

      // Build search filters from dream home finder data
      const filters: Record<string, string | number> = {
        searchMode: "residential",
      };

      // Parse budget
      if (data.budgetMin && data.budgetMin !== "No Minimum") {
        const min = parsePrice(data.budgetMin);
        if (min) filters.priceMin = min;
      }
      if (data.budgetMax && data.budgetMax !== "No Maximum") {
        const max = parsePrice(data.budgetMax);
        if (max) filters.priceMax = max;
      }

      // Parse beds/baths
      if (data.beds) {
        const bedsNum = parseInt(data.beds);
        if (bedsNum) filters.bedsMin = bedsNum;
      }
      if (data.baths) {
        const bathsNum = parseInt(data.baths);
        if (bathsNum) filters.bathsMin = bathsNum;
      }

      // Parse neighborhoods into query
      if (data.neighborhoods && Array.isArray(data.neighborhoods)) {
        filters.query = data.neighborhoods[0]; // Primary area
      } else if (data.areas) {
        filters.query = data.areas;
      }

      // Create saved search with daily alerts
      const searchName = data.firstName
        ? `${data.firstName}'s Dream Home`
        : "Dream Home Search";

      await prisma.savedSearch.create({
        data: {
          userId: user.id,
          name: searchName,
          filters,
          alertEnabled: true,
          alertFrequency: "daily",
        },
      });

      console.log("[DreamHomeFinder] Created SavedSearch for", data.email);
    } catch (e) {
      console.error("[DreamHomeFinder] Failed to create saved search:", e);
      // Don't fail the lead registration if saved search creation fails
    }
  }

  return NextResponse.json({ success: true });
}

function parsePrice(str: string): number | null {
  const cleaned = str.replace(/[^0-9.KkMm]/g, "");
  if (cleaned.toLowerCase().endsWith("m")) {
    return parseFloat(cleaned) * 1_000_000;
  }
  if (cleaned.toLowerCase().endsWith("k")) {
    return parseFloat(cleaned) * 1_000;
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
