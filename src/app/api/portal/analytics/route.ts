import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/analytics
 *
 * Returns business analytics data for the agent dashboard:
 * - Pipeline funnel (leads by stage)
 * - Activity trends (views, saves, showings over time)
 * - Lead source breakdown
 * - Conversion metrics
 * - Revenue tracking
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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const isAdmin = user.role === "ADMIN";
    const agentFilter = isAdmin ? {} : { agentId: user.id };

    // ── Pipeline Funnel ──
    const stages = ["new", "searching", "touring", "offer", "under_contract", "closed"];
    const funnelData = await Promise.all(
      stages.map(async (stage) => ({
        stage,
        count: await prisma.agentClient.count({
          where: { ...agentFilter, stage },
        }),
      }))
    );

    // ── Activity Trends (last 30 days, grouped by day) ──
    const activities = await prisma.listingActivity.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { action: true, createdAt: true },
    });

    const activityByDay: Record<string, { views: number; saves: number; showings: number; shares: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      activityByDay[d.toISOString().split("T")[0]] = { views: 0, saves: 0, showings: 0, shares: 0 };
    }
    for (const act of activities) {
      const key = act.createdAt.toISOString().split("T")[0];
      if (activityByDay[key]) {
        if (act.action === "view") activityByDay[key].views++;
        else if (act.action === "save") activityByDay[key].saves++;
        else if (act.action === "request_showing") activityByDay[key].showings++;
        else if (act.action === "share") activityByDay[key].shares++;
      }
    }

    const activityTrends = Object.entries(activityByDay)
      .map(([date, data]) => ({ date, label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), ...data }))
      .reverse();

    // ── Lead Source Breakdown ──
    // Count users by how they registered
    const totalUsers = await prisma.user.count({ where: { role: "USER" } });
    const totalClients = await prisma.user.count({ where: { role: "CLIENT" } });

    // ── Conversion Metrics ──
    const totalLeads = await prisma.agentClient.count({ where: agentFilter });
    const activeLeads = await prisma.agentClient.count({ where: { ...agentFilter, status: "active" } });
    const closedDeals = await prisma.transaction.count({ where: { ...agentFilter, status: "closed" } });
    const underContract = await prisma.transaction.count({ where: { ...agentFilter, status: "under_contract" } });

    const conversionRate = totalLeads > 0 ? Math.round((closedDeals / totalLeads) * 100) : 0;

    // ── Revenue (last 90 days) ──
    const recentClosedDeals = await prisma.transaction.findMany({
      where: {
        ...agentFilter,
        status: "closed",
        updatedAt: { gte: ninetyDaysAgo },
      },
      select: { contractPrice: true, commissionPct: true, createdAt: true },
    });

    const revenueByMonth: Record<string, { volume: number; gci: number; deals: number }> = {};
    for (const deal of recentClosedDeals) {
      const monthKey = deal.createdAt.toISOString().slice(0, 7);
      if (!revenueByMonth[monthKey]) revenueByMonth[monthKey] = { volume: 0, gci: 0, deals: 0 };
      const price = deal.contractPrice ? Number(deal.contractPrice) : 0;
      const pct = deal.commissionPct ? Number(deal.commissionPct) : 3;
      revenueByMonth[monthKey].volume += price;
      revenueByMonth[monthKey].gci += price * (pct / 100);
      revenueByMonth[monthKey].deals++;
    }

    const revenueData = Object.entries(revenueByMonth)
      .map(([month, data]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // ── Pipeline Value ──
    const pipelineAgg = await prisma.transaction.aggregate({
      where: { ...agentFilter, status: { in: ["under_contract", "pending"] } },
      _sum: { contractPrice: true },
      _count: true,
    });

    const closedAgg = await prisma.transaction.aggregate({
      where: { ...agentFilter, status: "closed" },
      _sum: { contractPrice: true },
      _count: true,
    });

    // ── Showing Stats ──
    const showingsRequested = await prisma.showingRequest.count({
      where: isAdmin ? {} : { agentId: user.id },
    });
    const showingsCompleted = await prisma.showingRequest.count({
      where: { ...(isAdmin ? {} : { agentId: user.id }), status: "completed" },
    });
    const showingConversion = showingsRequested > 0
      ? Math.round((showingsCompleted / showingsRequested) * 100) : 0;

    return NextResponse.json({
      funnel: funnelData,
      activityTrends,
      summary: {
        totalUsers,
        totalClients,
        totalLeads,
        activeLeads,
        closedDeals,
        underContract,
        conversionRate,
        pipelineValue: pipelineAgg._sum.contractPrice ? Number(pipelineAgg._sum.contractPrice) : 0,
        pipelineCount: pipelineAgg._count,
        totalVolume: closedAgg._sum.contractPrice ? Number(closedAgg._sum.contractPrice) : 0,
        totalGCI: recentClosedDeals.reduce((sum, d) => {
          const price = d.contractPrice ? Number(d.contractPrice) : 0;
          const pct = d.commissionPct ? Number(d.commissionPct) : 3;
          return sum + price * (pct / 100);
        }, 0),
        showingsRequested,
        showingsCompleted,
        showingConversion,
      },
      revenue: revenueData,
    });
  } catch (e) {
    console.error("[analytics] Error:", e);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
