import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * GET /api/portal/assign-client
 * Returns unassigned users (registered but no AgentClient relationship).
 *
 * POST /api/portal/assign-client
 * Creates an AgentClient relationship. Body: { clientId, priceMin?, priceMax?, targetAreas?, notes? }
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

    // Find users who have NO agent assignment
    const assignedClientIds = await prisma.agentClient.findMany({
      select: { clientId: true },
    });
    const assignedSet = new Set(assignedClientIds.map((r) => r.clientId));

    const unassigned = await prisma.user.findMany({
      where: {
        role: { in: ["USER", "CLIENT"] },
        id: { notIn: [...assignedSet] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            listingActivities: true,
            favorites: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ unassigned });
  } catch (e) {
    console.error("[assign-client] Error:", e);
    return NextResponse.json({ error: "Failed to load unassigned clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true },
    });
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, priceMin, priceMax, targetAreas, notes } = body;

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }

    // Check if already assigned
    const existing = await prisma.agentClient.findFirst({
      where: { clientId },
    });
    if (existing) {
      return NextResponse.json({ error: "Client already assigned to an agent" }, { status: 409 });
    }

    // Create relationship
    const relationship = await prisma.agentClient.create({
      data: {
        agentId: user.id,
        clientId,
        stage: "new",
        status: "active",
        priceMin: priceMin ? Number(priceMin) : null,
        priceMax: priceMax ? Number(priceMax) : null,
        targetAreas: targetAreas || [],
        notes: notes || null,
      },
    });

    // Upgrade user role to CLIENT
    await prisma.user.update({
      where: { id: clientId },
      data: { role: "CLIENT" },
    });

    // Notify the client
    await createNotification({
      userId: clientId,
      type: "system",
      title: `${user.name || "An agent"} has been assigned as your agent`,
      body: "You can now message them, request showings, and get personalized recommendations.",
      link: "/portal",
    }).catch(() => {});

    return NextResponse.json({ relationship });
  } catch (e) {
    console.error("[assign-client] POST error:", e);
    return NextResponse.json({ error: "Failed to assign client" }, { status: 500 });
  }
}
