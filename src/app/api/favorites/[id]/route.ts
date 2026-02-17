import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toggle favorite (add)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listingId } = await params;
  const userId = (session.user as { id: string }).id;
  const body = await req.json().catch(() => ({}));

  const favorite = await prisma.favoriteListing.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId, notes: body.notes },
    update: { notes: body.notes },
  });

  return NextResponse.json(favorite, { status: 201 });
}

// Remove favorite
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listingId } = await params;
  const userId = (session.user as { id: string }).id;

  await prisma.favoriteListing.deleteMany({
    where: { userId, listingId },
  });

  return NextResponse.json({ ok: true });
}
