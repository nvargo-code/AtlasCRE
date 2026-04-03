import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/daily-digest
 *
 * Returns a summary of the last 24 hours for the agent dashboard:
 * - New registered users
 * - Showing requests
 * - New messages
 * - Price changes on client saves
 * - New listings added
 * - Follow-up reminders
 */

export const dynamic = "force-dynamic";

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
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      newUsers,
      newShowings,
      newMessages,
      priceChanges,
      newListings,
      pendingShowings,
    ] = await Promise.all([
      // New registered users in last 24h
      prisma.user.count({
        where: { role: { in: ["USER", "CLIENT"] }, createdAt: { gte: yesterday } },
      }),

      // Showing requests in last 24h
      prisma.showingRequest.findMany({
        where: {
          createdAt: { gte: yesterday },
          ...(user.role !== "ADMIN" ? { agentId: user.id } : {}),
        },
        include: {
          listing: { select: { address: true, city: true } },
          client: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // New messages in last 24h
      prisma.message.count({
        where: {
          createdAt: { gte: yesterday },
          thread: {
            participants: { some: { userId: user.id } },
          },
          senderId: { not: user.id },
        },
      }),

      // Price changes in last 24h
      prisma.priceHistory.findMany({
        where: {
          event: "price_change",
          changeDate: { gte: yesterday },
        },
        include: {
          listing: { select: { id: true, address: true, city: true } },
        },
        take: 10,
      }),

      // New listings ingested in last 24h
      prisma.listing.count({
        where: { createdAt: { gte: yesterday } },
      }),

      // Total pending showings (any time)
      prisma.showingRequest.count({
        where: {
          status: "requested",
          ...(user.role !== "ADMIN" ? { agentId: user.id } : {}),
        },
      }),
    ]);

    return NextResponse.json({
      period: "24h",
      digest: {
        newUsers,
        newShowings: newShowings.length,
        showingDetails: newShowings.map((s) => ({
          address: s.listing.address,
          city: s.listing.city,
          client: s.client?.name || s.client?.email || "Unknown",
          status: s.status,
        })),
        newMessages,
        priceChanges: priceChanges.length,
        priceChangeDetails: priceChanges.map((p) => ({
          address: p.listing.address,
          city: p.listing.city,
          oldPrice: p.oldValue,
          newPrice: p.newValue,
        })),
        newListings,
        pendingShowings,
      },
    });
  } catch (e) {
    console.error("[daily-digest] Error:", e);
    return NextResponse.json({ error: "Failed to generate digest" }, { status: 500 });
  }
}
