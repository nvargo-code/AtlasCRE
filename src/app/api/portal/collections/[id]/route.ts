import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/portal/collections/:id — Get collection with all listings, reactions, comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, role: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      listings: {
        include: {
          listing: {
            select: {
              id: true, address: true, city: true, state: true, zip: true,
              priceAmount: true, priceUnit: true, beds: true, baths: true,
              buildingSf: true, yearBuilt: true, imageUrl: true, listingType: true,
              propSubType: true, propertyType: true, status: true, searchMode: true,
              lat: true, lng: true, description: true,
              hotScore: { select: { score: true, reasoning: true } },
            },
          },
          addedBy: { select: { name: true } },
          reactions: {
            include: { user: { select: { id: true, name: true } } },
          },
          comments: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check access — must be member, creator, or collection must be public
  if (!collection.isPublic && session) {
    const userId = (session.user as { id: string }).id;
    const isMember = collection.members.some((m) => m.userId === userId);
    const isCreator = collection.createdById === userId;
    if (!isMember && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!collection.isPublic) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Serialize Decimal fields
  const serialized = {
    ...collection,
    listings: collection.listings.map((cl) => ({
      ...cl,
      listing: {
        ...cl.listing,
        priceAmount: cl.listing.priceAmount ? Number(cl.listing.priceAmount) : null,
        lat: Number(cl.listing.lat),
        lng: Number(cl.listing.lng),
      },
    })),
  };

  return NextResponse.json({ collection: serialized });
}

// POST /api/portal/collections/:id — Add a listing to collection
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { listingId, reaction, comment } = await req.json();

  if (listingId) {
    // Add listing to collection
    const maxPos = await prisma.collectionListing.aggregate({
      where: { collectionId: id },
      _max: { position: true },
    });

    await prisma.collectionListing.create({
      data: {
        collectionId: id,
        listingId,
        addedById: userId,
        position: (maxPos._max.position ?? 0) + 1,
      },
    });
  }

  if (reaction) {
    // Add/update reaction on a collection listing
    const { collectionListingId, type } = reaction;
    await prisma.collectionReaction.upsert({
      where: {
        collectionListingId_userId: { collectionListingId, userId },
      },
      create: { collectionListingId, userId, reaction: type },
      update: { reaction: type },
    });
  }

  if (comment) {
    // Add comment to a collection listing
    const { collectionListingId, body } = comment;
    await prisma.collectionComment.create({
      data: { collectionListingId, userId, body },
    });
  }

  await prisma.collection.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
