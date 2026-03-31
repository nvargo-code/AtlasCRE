import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/portal/collections — List user's collections
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const collections = await prisma.collection.findMany({
    where: {
      OR: [
        { createdById: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      _count: { select: { listings: true, members: true } },
      listings: {
        take: 4,
        include: {
          listing: { select: { imageUrl: true, priceAmount: true, address: true } },
        },
        orderBy: { position: "asc" },
      },
      createdBy: { select: { name: true, role: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ collections });
}

// POST /api/portal/collections — Create a new collection
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { name, description, memberIds, listingIds } = await req.json();

  const collection = await prisma.collection.create({
    data: {
      name,
      description,
      createdById: userId,
      members: {
        create: [
          { userId, role: "owner" },
          ...(memberIds || []).map((id: string) => ({ userId: id, role: "editor" })),
        ],
      },
      listings: listingIds?.length ? {
        create: listingIds.map((listingId: string, i: number) => ({
          listingId,
          addedById: userId,
          position: i,
        })),
      } : undefined,
    },
    include: { _count: { select: { listings: true, members: true } } },
  });

  return NextResponse.json({ collection });
}
