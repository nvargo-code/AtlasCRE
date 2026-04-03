import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyShowingConfirmed } from "@/lib/notifications";

// GET /api/portal/showings — List showing requests for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string };

  const where = user.role === "AGENT" || user.role === "ADMIN"
    ? { agentId: user.id }
    : { clientId: user.id };

  const showings = await prisma.showingRequest.findMany({
    where,
    include: {
      listing: {
        select: {
          id: true, address: true, city: true, priceAmount: true,
          beds: true, baths: true, imageUrl: true,
        },
      },
      client: { select: { id: true, name: true, email: true, phone: true } },
      agent: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize Decimal
  const serialized = showings.map((s) => ({
    ...s,
    listing: { ...s.listing, priceAmount: s.listing.priceAmount ? Number(s.listing.priceAmount) : null },
  }));

  return NextResponse.json({ showings: serialized });
}

// POST /api/portal/showings — Request a showing
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { listingId, preferredDate, preferredTime, alternateDate } = await req.json();

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  // Find the client's assigned agent (if any)
  const agentRelation = await prisma.agentClient.findFirst({
    where: { clientId: userId, status: "active" },
    select: { agentId: true },
  });

  const showing = await prisma.showingRequest.create({
    data: {
      clientId: userId,
      agentId: agentRelation?.agentId || null,
      listingId,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      preferredTime,
      alternateDate: alternateDate ? new Date(alternateDate) : null,
    },
    include: {
      listing: { select: { address: true, city: true } },
    },
  });

  // Track activity
  await prisma.listingActivity.create({
    data: { userId, listingId, action: "request_showing" },
  });

  return NextResponse.json({ showing });
}

// PATCH /api/portal/showings — Update showing status (agent)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { showingId, status, rating, feedback, wouldOffer } = await req.json();

  const updated = await prisma.showingRequest.update({
    where: { id: showingId },
    data: {
      ...(status && { status }),
      ...(rating !== undefined && { rating }),
      ...(feedback !== undefined && { feedback }),
      ...(wouldOffer !== undefined && { wouldOffer }),
    },
    include: {
      listing: { select: { address: true } },
    },
  });

  // Notify client when showing is confirmed
  if (status === "confirmed" && updated.clientId) {
    const dateStr = updated.preferredDate
      ? new Date(updated.preferredDate).toLocaleDateString()
      : "TBD";
    notifyShowingConfirmed(
      updated.clientId,
      updated.listing.address,
      `${dateStr}${updated.preferredTime ? ` (${updated.preferredTime})` : ""}`
    ).catch(() => {});
  }

  return NextResponse.json({ showing: updated });
}
