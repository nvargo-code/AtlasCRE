import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/portal/activity — Track listing activity
 *
 * Body: { listingId, action, metadata?, sessionId? }
 * Actions: view, save, unsave, share, compare, request_showing, click_photo, time_spent
 *
 * Public endpoint — works for both logged-in and anonymous users.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session ? (session.user as { id: string }).id : null;

  const { listingId, action, metadata, sessionId } = await req.json();

  if (!listingId || !action) {
    return NextResponse.json({ error: "listingId and action required" }, { status: 400 });
  }

  await prisma.listingActivity.create({
    data: {
      userId,
      listingId,
      action,
      metadata: metadata || undefined,
      sessionId: sessionId || undefined,
    },
  });

  return NextResponse.json({ success: true });
}

/**
 * GET /api/portal/activity?listingId=... — Get activity stats for a listing (agent only)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listingId = req.nextUrl.searchParams.get("listingId");
  const clientId = req.nextUrl.searchParams.get("clientId");

  if (listingId) {
    // Activity for a specific listing
    const [views, saves, showings, shares] = await Promise.all([
      prisma.listingActivity.count({ where: { listingId, action: "view" } }),
      prisma.listingActivity.count({ where: { listingId, action: "save" } }),
      prisma.listingActivity.count({ where: { listingId, action: "request_showing" } }),
      prisma.listingActivity.count({ where: { listingId, action: "share" } }),
    ]);

    // Recent activity timeline
    const timeline = await prisma.listingActivity.findMany({
      where: { listingId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ views, saves, showings, shares, timeline });
  }

  if (clientId) {
    // Activity for a specific client (agent viewing client behavior)
    const activity = await prisma.listingActivity.findMany({
      where: { userId: clientId },
      include: {
        listing: { select: { id: true, address: true, city: true, priceAmount: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const serialized = activity.map((a) => ({
      ...a,
      listing: a.listing ? {
        ...a.listing,
        priceAmount: a.listing.priceAmount ? Number(a.listing.priceAmount) : null,
      } : null,
    }));

    return NextResponse.json({ activity: serialized });
  }

  return NextResponse.json({ error: "listingId or clientId required" }, { status: 400 });
}
