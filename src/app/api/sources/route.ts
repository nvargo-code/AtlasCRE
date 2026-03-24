import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sources = await prisma.listingSource.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json(sources);
}
