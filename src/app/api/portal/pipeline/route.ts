import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/pipeline
 *
 * Returns all agent-client relationships grouped by stage for the pipeline board.
 * Agent/Admin only.
 *
 * PATCH /api/portal/pipeline
 * Updates a client's stage (drag-and-drop on the pipeline board).
 * Body: { clientId: string, stage: string, notes?: string }
 */

export const dynamic = "force-dynamic";

const STAGES = ["new", "searching", "touring", "offer", "under_contract", "closed"] as const;

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

    // Get all client relationships for this agent
    const relationships = await prisma.agentClient.findMany({
      where: user.role === "ADMIN" ? {} : { agentId: user.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
            // Get recent activity count
            listingActivities: {
              where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
              select: { id: true },
            },
            // Get favorites count
            favorites: { select: { id: true } },
            // Get showing requests
            showingRequestsAsClient: {
              where: { status: { in: ["requested", "confirmed"] } },
              select: { id: true, status: true },
            },
          },
        },
        agent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Group by stage
    const pipeline: Record<string, typeof relationships> = {};
    for (const stage of STAGES) {
      pipeline[stage] = [];
    }

    for (const rel of relationships) {
      const stage = STAGES.includes(rel.stage as typeof STAGES[number]) ? rel.stage : "new";
      if (!pipeline[stage]) pipeline[stage] = [];
      pipeline[stage].push(rel);
    }

    // Summary stats
    const stats = {
      total: relationships.length,
      active: relationships.filter((r) => r.status === "active").length,
      byStage: Object.fromEntries(STAGES.map((s) => [s, pipeline[s].length])),
    };

    return NextResponse.json({ pipeline, stats, stages: STAGES });
  } catch (e) {
    console.error("[pipeline] Error:", e);
    return NextResponse.json({ error: "Failed to load pipeline" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    const { clientId, stage, notes } = body;

    if (!clientId || !stage) {
      return NextResponse.json({ error: "clientId and stage required" }, { status: 400 });
    }

    if (!STAGES.includes(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }

    // Find the relationship
    const where = user.role === "ADMIN"
      ? { agentId_clientId: { agentId: user.id, clientId } }
      : { agentId_clientId: { agentId: user.id, clientId } };

    // Try to find any relationship for this client
    const existing = await prisma.agentClient.findFirst({
      where: {
        clientId,
        ...(user.role !== "ADMIN" ? { agentId: user.id } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Client relationship not found" }, { status: 404 });
    }

    const updated = await prisma.agentClient.update({
      where: { id: existing.id },
      data: {
        stage,
        ...(notes !== undefined ? { notes } : {}),
        ...(stage === "closed" ? { status: "closed" } : {}),
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (e) {
    console.error("[pipeline] PATCH error:", e);
    return NextResponse.json({ error: "Failed to update pipeline" }, { status: 500 });
  }
}
