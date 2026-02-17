import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFiltersFromParams, buildListingWhere } from "@/lib/filters";
import { generateExcel, generateCSV, generatePDF } from "@/lib/export";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const format = params.get("format") || "xlsx";
  const filters = parseFiltersFromParams(params);
  const where = buildListingWhere(filters);

  const listings = await prisma.listing.findMany({
    where,
    take: 5000,
    orderBy: { updatedAt: "desc" },
  });

  if (format === "csv") {
    const csv = generateCSV(listings);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=atlas-cre-export.csv",
      },
    });
  }

  if (format === "pdf") {
    const pdf = generatePDF(listings);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=atlas-cre-export.pdf",
      },
    });
  }

  // Default: xlsx
  const buffer = generateExcel(listings);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=atlas-cre-export.xlsx",
    },
  });
}
