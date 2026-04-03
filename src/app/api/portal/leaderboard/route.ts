import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/leaderboard
 *
 * Returns team performance data for the leaderboard.
 * Agent/Admin only.
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

    // Get all agents
    const agents = await prisma.user.findMany({
      where: { role: { in: ["AGENT", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // For each agent, calculate stats
    const leaderboard = await Promise.all(
      agents.map(async (agent) => {
        const [
          totalClients,
          activeClients,
          closedDeals,
          underContract,
          pipelineValue,
          showingsCompleted,
        ] = await Promise.all([
          prisma.agentClient.count({ where: { agentId: agent.id } }),
          prisma.agentClient.count({ where: { agentId: agent.id, status: "active" } }),
          prisma.transaction.count({ where: { agentId: agent.id, status: "closed" } }),
          prisma.transaction.count({ where: { agentId: agent.id, status: "under_contract" } }),
          prisma.transaction.aggregate({
            where: { agentId: agent.id, status: { in: ["under_contract", "pending"] } },
            _sum: { contractPrice: true },
          }),
          prisma.showingRequest.count({
            where: { agentId: agent.id, status: "completed" },
          }),
        ]);

        // GCI (Gross Commission Income) from closed deals
        const closedGCI = await prisma.transaction.aggregate({
          where: { agentId: agent.id, status: "closed" },
          _sum: { contractPrice: true, commissionPct: true },
        });

        const totalVolume = closedGCI._sum.contractPrice ? Number(closedGCI._sum.contractPrice) : 0;
        const avgCommission = closedGCI._sum.commissionPct ? Number(closedGCI._sum.commissionPct) : 3; // default 3%
        const gci = totalVolume * (avgCommission / 100);

        const pipelineVal = pipelineValue._sum.contractPrice ? Number(pipelineValue._sum.contractPrice) : 0;

        return {
          id: agent.id,
          name: agent.name || agent.email.split("@")[0],
          email: agent.email,
          avatarUrl: agent.avatarUrl,
          stats: {
            totalClients,
            activeClients,
            closedDeals,
            underContract,
            pipelineValue: pipelineVal,
            gci: Math.round(gci),
            totalVolume: Math.round(totalVolume),
            showingsCompleted,
          },
        };
      })
    );

    // Sort by GCI (or closed deals if no GCI data)
    leaderboard.sort((a, b) => {
      if (b.stats.gci !== a.stats.gci) return b.stats.gci - a.stats.gci;
      return b.stats.closedDeals - a.stats.closedDeals;
    });

    // Team totals
    const teamTotals = {
      totalClients: leaderboard.reduce((s, a) => s + a.stats.totalClients, 0),
      closedDeals: leaderboard.reduce((s, a) => s + a.stats.closedDeals, 0),
      totalVolume: leaderboard.reduce((s, a) => s + a.stats.totalVolume, 0),
      totalGCI: leaderboard.reduce((s, a) => s + a.stats.gci, 0),
      pipelineValue: leaderboard.reduce((s, a) => s + a.stats.pipelineValue, 0),
      underContract: leaderboard.reduce((s, a) => s + a.stats.underContract, 0),
    };

    return NextResponse.json({ leaderboard, teamTotals });
  } catch (e) {
    console.error("[leaderboard] Error:", e);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
