import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/offers?listingId=xxx
 * Returns all offers for a listing.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = req.nextUrl.searchParams.get("listingId");

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const where = listingId
      ? { listingId, ...(user.role === "ADMIN" ? {} : { agentId: user.id }) }
      : user.role === "ADMIN" ? {} : { agentId: user.id };

    const offers = await prisma.offer.findMany({
      where,
      include: {
        listing: {
          select: { id: true, address: true, city: true, priceAmount: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ offers });
  } catch (e) {
    console.error("[offers] Error:", e);
    return NextResponse.json({ error: "Failed to load offers" }, { status: 500 });
  }
}

/**
 * POST /api/portal/offers
 * Log a new incoming offer.
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
    const offer = await prisma.offer.create({
      data: {
        listingId: body.listingId,
        agentId: user.id,
        transactionId: body.transactionId || null,
        offerPrice: Number(body.offerPrice),
        buyerName: body.buyerName,
        buyerAgent: body.buyerAgent || null,
        buyerAgentPhone: body.buyerAgentPhone || null,
        buyerAgentEmail: body.buyerAgentEmail || null,
        buyerPreApproved: body.buyerPreApproved || false,
        financingType: body.financingType || "conventional",
        earnestMoney: body.earnestMoney ? Number(body.earnestMoney) : null,
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        optionPeriod: body.optionPeriod ? Number(body.optionPeriod) : null,
        optionFee: body.optionFee ? Number(body.optionFee) : null,
        contingencies: body.contingencies || null,
        escalationClause: body.escalationClause ? Number(body.escalationClause) : null,
        notes: body.notes || null,
        respondBy: body.respondBy ? new Date(body.respondBy) : null,
      },
    });

    return NextResponse.json({ offer });
  } catch (e) {
    console.error("[offers] POST error:", e);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}

/**
 * PATCH /api/portal/offers
 * Update offer status (accept, reject, counter).
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, counterPrice, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        status,
        ...(counterPrice ? { counterPrice: Number(counterPrice) } : {}),
        ...(notes !== undefined ? { notes } : {}),
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ offer });
  } catch (e) {
    console.error("[offers] PATCH error:", e);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}
