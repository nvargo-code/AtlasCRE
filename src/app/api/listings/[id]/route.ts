import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      variants: {
        include: { source: { select: { name: true, slug: true } } },
        orderBy: { fetchedAt: "desc" },
      },
      favorites: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { favorites, ...rest } = listing;
  return NextResponse.json({ ...rest, isFavorited: favorites.length > 0 });
}
