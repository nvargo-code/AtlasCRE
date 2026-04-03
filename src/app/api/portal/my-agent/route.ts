import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/my-agent
 *
 * Returns the assigned agent for the current client.
 * If no agent is assigned, returns the default team contact.
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

    // Find assigned agent via AgentClient relationship
    const relationship = await prisma.agentClient.findFirst({
      where: { clientId: user.id, status: "active" },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (relationship) {
      return NextResponse.json({
        agent: relationship.agent,
        stage: relationship.stage,
        assigned: true,
      });
    }

    // No assigned agent — return team default
    // Find first available agent
    const defaultAgent = await prisma.user.findFirst({
      where: { role: { in: ["AGENT", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (defaultAgent) {
      return NextResponse.json({
        agent: defaultAgent,
        stage: null,
        assigned: false, // Not formally assigned — this is the team default
      });
    }

    return NextResponse.json({ agent: null, assigned: false });
  } catch (e) {
    console.error("[my-agent] Error:", e);
    return NextResponse.json({ error: "Failed to load agent" }, { status: 500 });
  }
}
