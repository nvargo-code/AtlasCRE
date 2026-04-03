import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/follow-ups
 *
 * Analyzes client activity and generates smart follow-up suggestions.
 * Returns prioritized action items for agents:
 * - "John viewed 4 homes in Westlake this week — draft a text?"
 * - "Sarah's saved search has 3 new matches — send a collection?"
 * - "Mike completed a showing 2 days ago — follow up on feedback?"
 */

export const dynamic = "force-dynamic";

interface FollowUpSuggestion {
  id: string;
  priority: "high" | "medium" | "low";
  clientId: string;
  clientName: string;
  clientEmail: string;
  type: string;
  title: string;
  body: string;
  suggestedMessage: string;
  action: string;
  data: Record<string, unknown>;
}

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
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const agentFilter = user.role === "ADMIN" ? {} : { agentId: user.id };

    // Get all active clients
    const clients = await prisma.agentClient.findMany({
      where: { ...agentFilter, status: "active" },
      include: {
        client: {
          select: {
            id: true, name: true, email: true, phone: true,
          },
        },
      },
    });

    const suggestions: FollowUpSuggestion[] = [];
    let idCounter = 0;

    for (const rel of clients) {
      const client = rel.client;
      const clientName = client.name || client.email.split("@")[0];

      // 1. Check for completed showings without follow-up
      const recentShowings = await prisma.showingRequest.findMany({
        where: {
          clientId: client.id,
          status: "completed",
          updatedAt: { gte: twoDaysAgo },
          feedback: null, // No feedback yet
        },
        include: {
          listing: { select: { address: true, city: true, priceAmount: true } },
        },
      });

      for (const showing of recentShowings) {
        const price = showing.listing.priceAmount
          ? `$${Number(showing.listing.priceAmount).toLocaleString()}`
          : "";
        suggestions.push({
          id: `fu-${++idCounter}`,
          priority: "high",
          clientId: client.id,
          clientName,
          clientEmail: client.email,
          type: "showing_follow_up",
          title: `Follow up after showing: ${showing.listing.address}`,
          body: `${clientName} toured ${showing.listing.address} ${price} recently but hasn't provided feedback.`,
          suggestedMessage: `Hey ${clientName}! How did you feel about ${showing.listing.address}? I'd love to hear your thoughts — was it what you expected? Anything you'd like to see more of (or less of) in the next homes we look at?`,
          action: "Send follow-up text",
          data: { showingId: showing.id, listingAddress: showing.listing.address },
        });
      }

      // 2. Check for high view activity (hot lead behavior)
      const weekViews = await prisma.listingActivity.count({
        where: { userId: client.id, action: "view", createdAt: { gte: sevenDaysAgo } },
      });

      const weekSaves = await prisma.listingActivity.count({
        where: { userId: client.id, action: "save", createdAt: { gte: sevenDaysAgo } },
      });

      if (weekViews >= 10 && weekSaves >= 2) {
        // Get most-viewed areas
        const recentViews = await prisma.listingActivity.findMany({
          where: { userId: client.id, action: "view", createdAt: { gte: sevenDaysAgo } },
          include: { listing: { select: { zip: true, city: true } } },
          take: 20,
        });

        const zipCounts: Record<string, number> = {};
        for (const v of recentViews) {
          const z = v.listing.zip || v.listing.city;
          zipCounts[z] = (zipCounts[z] || 0) + 1;
        }
        const topArea = Object.entries(zipCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Austin";

        suggestions.push({
          id: `fu-${++idCounter}`,
          priority: "high",
          clientId: client.id,
          clientName,
          clientEmail: client.email,
          type: "hot_lead_outreach",
          title: `${clientName} is very active — ${weekViews} views, ${weekSaves} saves this week`,
          body: `Mostly looking in ${topArea}. This is strong buying intent — consider proactive outreach.`,
          suggestedMessage: `Hey ${clientName}! I noticed you've been checking out some great homes in ${topArea} this week. I just saw a couple of new listings that might be perfect for you — want me to send them over, or should we schedule some tours this weekend?`,
          action: "Send proactive outreach",
          data: { weekViews, weekSaves, topArea },
        });
      }

      // 3. Check for saved homes without showing requests
      const savedCount = await prisma.favoriteListing.count({
        where: { userId: client.id },
      });

      const showingCount = await prisma.showingRequest.count({
        where: { clientId: client.id },
      });

      if (savedCount >= 3 && showingCount === 0) {
        suggestions.push({
          id: `fu-${++idCounter}`,
          priority: "medium",
          clientId: client.id,
          clientName,
          clientEmail: client.email,
          type: "tour_suggestion",
          title: `${clientName} has ${savedCount} saved homes but no tours scheduled`,
          body: `They're interested but haven't taken the next step. Suggest a tour.`,
          suggestedMessage: `Hey ${clientName}! I see you've saved some great properties. Would you like to schedule tours for any of them? I can set up a few back-to-back this weekend if that works for you.`,
          action: "Suggest a tour",
          data: { savedCount },
        });
      }

      // 4. Check for inactive clients (no activity in 14+ days)
      const lastActivity = await prisma.listingActivity.findFirst({
        where: { userId: client.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      if (lastActivity) {
        const daysSinceLast = Math.floor((now.getTime() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLast >= 14) {
          suggestions.push({
            id: `fu-${++idCounter}`,
            priority: "low",
            clientId: client.id,
            clientName,
            clientEmail: client.email,
            type: "re_engagement",
            title: `${clientName} hasn't been active in ${daysSinceLast} days`,
            body: `Consider a check-in to keep the relationship warm.`,
            suggestedMessage: `Hey ${clientName}! Just checking in — I wanted to make sure you're still getting the listing alerts you want. The market has had some interesting movement lately. Want me to send you an updated market report for the areas you were looking at?`,
            action: "Send check-in",
            data: { daysSinceLast },
          });
        }
      }
    }

    // Sort by priority (high → medium → low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({
      suggestions,
      summary: {
        total: suggestions.length,
        high: suggestions.filter((s) => s.priority === "high").length,
        medium: suggestions.filter((s) => s.priority === "medium").length,
        low: suggestions.filter((s) => s.priority === "low").length,
      },
    });
  } catch (e) {
    console.error("[follow-ups] Error:", e);
    return NextResponse.json({ error: "Failed to generate follow-ups" }, { status: 500 });
  }
}
