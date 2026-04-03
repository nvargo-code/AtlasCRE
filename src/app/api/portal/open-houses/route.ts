import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/open-houses
 * Returns all open houses for the agent. Includes upcoming and past.
 */
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isAgent = user.role === "AGENT" || user.role === "ADMIN";
    if (!isAgent) return NextResponse.json({ error: "Agent access required" }, { status: 403 });

    const openHouses = await prisma.openHouse.findMany({
      where: user.role === "ADMIN" ? {} : { agentId: user.id },
      include: {
        listing: {
          select: {
            id: true, address: true, city: true, zip: true,
            priceAmount: true, beds: true, baths: true,
            buildingSf: true, imageUrl: true,
          },
        },
        agent: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ openHouses });
  } catch (e) {
    console.error("[open-houses] Error:", e);
    return NextResponse.json({ error: "Failed to load open houses" }, { status: 500 });
  }
}

/**
 * POST /api/portal/open-houses
 * Create a new open house event.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }

    const body = await req.json();
    const { listingId, date, startTime, endTime, notes } = body;

    if (!listingId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "listingId, date, startTime, endTime required" }, { status: 400 });
    }

    const openHouse = await prisma.openHouse.create({
      data: {
        listingId,
        agentId: user.id,
        date: new Date(date),
        startTime,
        endTime,
        notes: notes || null,
      },
      include: {
        listing: {
          select: { id: true, address: true, city: true, priceAmount: true, imageUrl: true },
        },
      },
    });

    return NextResponse.json({ openHouse });
  } catch (e) {
    console.error("[open-houses] POST error:", e);
    return NextResponse.json({ error: "Failed to create open house" }, { status: 500 });
  }
}

/**
 * PATCH /api/portal/open-houses
 * Update open house status or details.
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, rsvpCount, notes } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updated = await prisma.openHouse.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(rsvpCount !== undefined ? { rsvpCount } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    return NextResponse.json({ openHouse: updated });
  } catch (e) {
    console.error("[open-houses] PATCH error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
