import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete all variants first (FK constraint), then all listings
  const variants = await prisma.listingVariant.deleteMany({});
  const listings = await prisma.listing.deleteMany({});

  return NextResponse.json({ deletedVariants: variants.count, deletedListings: listings.count });
}
