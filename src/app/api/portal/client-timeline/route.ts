import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/client-timeline?clientId=xxx
 *
 * Returns a chronological timeline of all activity for a specific client:
 * views, saves, showings, messages, collection activity.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }

    // Get client info
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    // Fetch all activities in parallel
    const [activities, showings, favorites, messages] = await Promise.all([
      prisma.listingActivity.findMany({
        where: { userId: clientId },
        include: {
          listing: { select: { id: true, address: true, city: true, priceAmount: true, imageUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.showingRequest.findMany({
        where: { clientId },
        include: {
          listing: { select: { id: true, address: true, city: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.favoriteListing.findMany({
        where: { userId: clientId },
        include: {
          listing: { select: { id: true, address: true, city: true, priceAmount: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.message.findMany({
        where: { senderId: clientId },
        include: {
          thread: { select: { listingId: true, listing: { select: { address: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    // Merge into unified timeline
    type TimelineEvent = {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      timestamp: string;
      listingId?: string;
    };

    const timeline: TimelineEvent[] = [];

    for (const a of activities) {
      const actionLabels: Record<string, string> = {
        view: "Viewed", save: "Saved", share: "Shared", compare: "Compared",
        request_showing: "Requested showing", click_photo: "Viewed photos",
      };
      timeline.push({
        id: `act-${a.id}`,
        type: a.action,
        title: `${actionLabels[a.action] || a.action} a listing`,
        subtitle: a.listing ? `${a.listing.address}, ${a.listing.city}` : "",
        timestamp: a.createdAt.toISOString(),
        listingId: a.listingId,
      });
    }

    for (const s of showings) {
      timeline.push({
        id: `show-${s.id}`,
        type: "showing",
        title: `Showing ${s.status}: ${s.listing.address}`,
        subtitle: s.rating ? `Rated ${s.rating}/5${s.wouldOffer ? " — would offer" : ""}` : s.status,
        timestamp: s.createdAt.toISOString(),
        listingId: s.listingId,
      });
    }

    for (const m of messages) {
      timeline.push({
        id: `msg-${m.id}`,
        type: "message",
        title: "Sent a message",
        subtitle: m.body.slice(0, 80) + (m.body.length > 80 ? "..." : ""),
        timestamp: m.createdAt.toISOString(),
        listingId: m.thread?.listingId || undefined,
      });
    }

    // Sort by timestamp descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Stats
    const stats = {
      totalViews: activities.filter((a) => a.action === "view").length,
      totalSaves: favorites.length,
      totalShowings: showings.length,
      totalMessages: messages.length,
      memberSince: client.createdAt.toISOString(),
    };

    return NextResponse.json({ client, timeline: timeline.slice(0, 50), stats });
  } catch (e) {
    console.error("[client-timeline] Error:", e);
    return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
  }
}
