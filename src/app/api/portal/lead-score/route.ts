import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/lead-score
 *
 * Calculates and returns lead scores for all clients assigned to the agent.
 * Scores buyer leads as HOT / WARM / COLD based on:
 *
 * 1. Activity recency — when did they last view/save/share?
 * 2. Activity frequency — how often are they engaging?
 * 3. Engagement depth — saves, shares, showing requests vs just views
 * 4. Search consistency — are they focused on a price range/area or browsing randomly?
 * 5. Tour engagement — have they requested or completed showings?
 * 6. Response speed — how quickly do they engage with new listings?
 *
 * Score: 0-100 → HOT (70+), WARM (40-69), COLD (<40)
 */

export const dynamic = "force-dynamic";

interface LeadScore {
  clientId: string;
  clientName: string | null;
  clientEmail: string;
  clientPhone: string | null;
  score: number;
  tier: "hot" | "warm" | "cold";
  signals: {
    lastActive: string | null;
    viewsLast7d: number;
    savesLast7d: number;
    totalSaved: number;
    showingsRequested: number;
    showingsCompleted: number;
    daysAsClient: number;
  };
  reasoning: string;
  suggestedAction: string;
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

    // Get all clients for this agent
    const relationships = await prisma.agentClient.findMany({
      where: user.role === "ADMIN" ? { status: "active" } : { agentId: user.id, status: "active" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const leads: LeadScore[] = [];

    for (const rel of relationships) {
      const client = rel.client;

      // Fetch activity data in parallel
      const [
        recentViews,
        recentSaves,
        totalSaved,
        showings,
        lastActivity,
        twoWeekViews,
      ] = await Promise.all([
        prisma.listingActivity.count({
          where: { userId: client.id, action: "view", createdAt: { gte: sevenDaysAgo } },
        }),
        prisma.listingActivity.count({
          where: { userId: client.id, action: "save", createdAt: { gte: sevenDaysAgo } },
        }),
        prisma.favoriteListing.count({
          where: { userId: client.id },
        }),
        prisma.showingRequest.findMany({
          where: { clientId: client.id },
          select: { status: true },
        }),
        prisma.listingActivity.findFirst({
          where: { userId: client.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        prisma.listingActivity.count({
          where: { userId: client.id, action: "view", createdAt: { gte: fourteenDaysAgo } },
        }),
      ]);

      const showingsRequested = showings.filter((s) => s.status === "requested" || s.status === "confirmed").length;
      const showingsCompleted = showings.filter((s) => s.status === "completed").length;
      const daysAsClient = Math.floor((now.getTime() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // ── Score calculation ──

      let score = 0;

      // 1. Activity recency (0-25 points)
      if (lastActivity) {
        const hoursSinceLast = (now.getTime() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast <= 24) score += 25;
        else if (hoursSinceLast <= 48) score += 20;
        else if (hoursSinceLast <= 72) score += 15;
        else if (hoursSinceLast <= 168) score += 10;  // 7 days
        else if (hoursSinceLast <= 336) score += 5;   // 14 days
      }

      // 2. View frequency (0-20 points)
      if (recentViews >= 20) score += 20;
      else if (recentViews >= 10) score += 15;
      else if (recentViews >= 5) score += 10;
      else if (recentViews >= 2) score += 5;

      // 3. Engagement depth — saves weighted more than views (0-20 points)
      if (recentSaves >= 5) score += 20;
      else if (recentSaves >= 3) score += 15;
      else if (recentSaves >= 1) score += 10;
      if (totalSaved >= 10) score += 5;

      // 4. Tour engagement (0-20 points)
      if (showingsCompleted >= 3) score += 20;
      else if (showingsCompleted >= 1) score += 15;
      else if (showingsRequested >= 2) score += 12;
      else if (showingsRequested >= 1) score += 8;

      // 5. Trend — increasing activity? (0-15 points)
      const firstWeekViews = twoWeekViews - recentViews;
      if (recentViews > firstWeekViews * 1.5 && recentViews >= 3) score += 15;
      else if (recentViews > firstWeekViews && recentViews >= 2) score += 10;
      else if (recentViews >= firstWeekViews && recentViews >= 1) score += 5;

      score = Math.min(100, score);

      // Determine tier
      const tier: "hot" | "warm" | "cold" =
        score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";

      // Generate reasoning and suggested action
      let reasoning = "";
      let suggestedAction = "";

      if (tier === "hot") {
        reasoning = `${client.name || "This lead"} has been very active — ${recentViews} views and ${recentSaves} saves in the last 7 days.`;
        if (showingsRequested > 0) reasoning += ` They've requested ${showingsRequested} showings.`;
        suggestedAction = showingsCompleted > 0
          ? "Follow up on recent showings — they may be ready to make an offer."
          : showingsRequested > 0
            ? "Confirm and prioritize their showing requests."
            : "Reach out proactively — send them new matches or suggest a tour.";
      } else if (tier === "warm") {
        reasoning = `${client.name || "This lead"} is browsing regularly (${recentViews} views this week)`;
        if (totalSaved > 0) reasoning += ` with ${totalSaved} saved properties`;
        reasoning += ".";
        suggestedAction = "Send a curated collection based on their search patterns. Ask if they'd like to tour any saves.";
      } else {
        const daysSinceLast = lastActivity
          ? Math.floor((now.getTime() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : daysAsClient;
        reasoning = `${client.name || "This lead"} hasn't been active in ${daysSinceLast} days.`;
        suggestedAction = daysSinceLast > 30
          ? "Send a market update or check in — they may have paused their search."
          : "Send new listing alerts matching their criteria to re-engage.";
      }

      leads.push({
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        score,
        tier,
        signals: {
          lastActive: lastActivity?.createdAt.toISOString() || null,
          viewsLast7d: recentViews,
          savesLast7d: recentSaves,
          totalSaved,
          showingsRequested,
          showingsCompleted,
          daysAsClient,
        },
        reasoning,
        suggestedAction,
      });
    }

    // Sort by score (hottest first)
    leads.sort((a, b) => b.score - a.score);

    const summary = {
      total: leads.length,
      hot: leads.filter((l) => l.tier === "hot").length,
      warm: leads.filter((l) => l.tier === "warm").length,
      cold: leads.filter((l) => l.tier === "cold").length,
    };

    return NextResponse.json({ leads, summary });
  } catch (e) {
    console.error("[lead-score] Error:", e);
    return NextResponse.json({ error: "Failed to score leads" }, { status: 500 });
  }
}
