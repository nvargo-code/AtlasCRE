import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/seller
 *
 * Returns seller dashboard data for the authenticated user's listing.
 * Shows: views, saves, showing requests + feedback, price history,
 * activity timeline.
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
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find transactions where this user is the client (seller side)
    // OR find listings where agent has them as a seller
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { clientId: user.id, type: "sell" },
          ...(user.role === "AGENT" || user.role === "ADMIN" ? [{ agentId: user.id, type: "sell" }] : []),
        ],
        status: { in: ["under_contract", "pending"] },
      },
      select: { listingId: true },
    });

    // Also check if user is an agent with sell-side listings
    const agentListings = user.role === "AGENT" || user.role === "ADMIN"
      ? await prisma.transaction.findMany({
          where: { agentId: user.id, type: "sell" },
          select: { listingId: true, propertyAddress: true },
        })
      : [];

    // Collect listing IDs
    const listingIds = [
      ...transactions.map((t) => t.listingId).filter(Boolean),
      ...agentListings.map((t) => t.listingId).filter(Boolean),
    ] as string[];

    // If no listings from transactions, try to find any listing the user created
    // (for agents who listed properties)
    if (listingIds.length === 0 && (user.role === "AGENT" || user.role === "ADMIN")) {
      const allAgentTransactions = await prisma.transaction.findMany({
        where: { agentId: user.id },
        select: { listingId: true },
      });
      listingIds.push(...allAgentTransactions.map((t) => t.listingId).filter(Boolean) as string[]);
    }

    if (listingIds.length === 0) {
      return NextResponse.json({ listings: [], hasListings: false });
    }

    // Fetch listing data with activity
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const listings = await Promise.all(
      [...new Set(listingIds)].map(async (listingId) => {
        const listing = await prisma.listing.findUnique({
          where: { id: listingId },
          select: {
            id: true,
            address: true,
            city: true,
            zip: true,
            priceAmount: true,
            beds: true,
            baths: true,
            buildingSf: true,
            imageUrl: true,
            status: true,
            createdAt: true,
          },
        });

        if (!listing) return null;

        // Activity counts
        const [
          totalViews,
          weekViews,
          totalSaves,
          weekSaves,
          showings,
          priceHistory,
          recentActivity,
        ] = await Promise.all([
          prisma.listingActivity.count({ where: { listingId, action: "view" } }),
          prisma.listingActivity.count({ where: { listingId, action: "view", createdAt: { gte: sevenDaysAgo } } }),
          prisma.listingActivity.count({ where: { listingId, action: "save" } }),
          prisma.listingActivity.count({ where: { listingId, action: "save", createdAt: { gte: sevenDaysAgo } } }),
          prisma.showingRequest.findMany({
            where: { listingId },
            select: {
              id: true,
              status: true,
              preferredDate: true,
              rating: true,
              feedback: true,
              wouldOffer: true,
              client: { select: { name: true } },
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.priceHistory.findMany({
            where: { listingId },
            orderBy: { changeDate: "desc" },
            take: 10,
          }),
          prisma.listingActivity.findMany({
            where: { listingId, createdAt: { gte: thirtyDaysAgo } },
            select: { action: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 100,
          }),
        ]);

        // Group activity by day for the chart
        const activityByDay: Record<string, { views: number; saves: number }> = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split("T")[0];
          activityByDay[key] = { views: 0, saves: 0 };
        }
        for (const act of recentActivity) {
          const key = act.createdAt.toISOString().split("T")[0];
          if (activityByDay[key]) {
            if (act.action === "view") activityByDay[key].views++;
            if (act.action === "save") activityByDay[key].saves++;
          }
        }

        const daysOnMarket = Math.floor((now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...listing,
          priceAmount: listing.priceAmount ? Number(listing.priceAmount) : null,
          buildingSf: listing.buildingSf ? Number(listing.buildingSf) : null,
          stats: {
            totalViews,
            weekViews,
            totalSaves,
            weekSaves,
            daysOnMarket,
            showingsTotal: showings.length,
            showingsCompleted: showings.filter((s) => s.status === "completed").length,
            avgRating: showings.filter((s) => s.rating).length > 0
              ? Math.round(showings.filter((s) => s.rating).reduce((sum, s) => sum + s.rating!, 0) / showings.filter((s) => s.rating).length * 10) / 10
              : null,
            wouldOfferCount: showings.filter((s) => s.wouldOffer).length,
          },
          showings: showings.map((s) => ({
            ...s,
            client: s.client,
          })),
          priceHistory,
          activityByDay: Object.entries(activityByDay)
            .map(([date, data]) => ({ date, ...data }))
            .reverse(),
        };
      })
    );

    return NextResponse.json({
      listings: listings.filter(Boolean),
      hasListings: true,
    });
  } catch (e) {
    console.error("[seller] Error:", e);
    return NextResponse.json({ error: "Failed to load seller data" }, { status: 500 });
  }
}
