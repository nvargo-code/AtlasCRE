import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const favorites = await prisma.favoriteListing.findMany({
    where: { userId },
    include: {
      listing: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          lat: true,
          lng: true,
          propertyType: true,
          listingType: true,
          priceAmount: true,
          priceUnit: true,
          buildingSf: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}
