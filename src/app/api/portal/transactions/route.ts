import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_MILESTONES = [
  { name: "Contract Executed", position: 0 },
  { name: "Option Period", position: 1 },
  { name: "Inspection", position: 2 },
  { name: "Appraisal", position: 3 },
  { name: "Loan Approval", position: 4 },
  { name: "Title Work", position: 5 },
  { name: "Final Walkthrough", position: 6 },
  { name: "Closing", position: 7 },
];

const DEFAULT_TASKS = [
  { title: "Deliver earnest money", assignedTo: "client", position: 0 },
  { title: "Schedule home inspection", assignedTo: "agent", position: 1 },
  { title: "Review inspection report", assignedTo: "client", position: 2 },
  { title: "Submit repair requests", assignedTo: "agent", position: 3 },
  { title: "Order appraisal", assignedTo: "lender", position: 4 },
  { title: "Review appraisal report", assignedTo: "agent", position: 5 },
  { title: "Provide docs to lender", assignedTo: "client", position: 6 },
  { title: "Obtain homeowner insurance", assignedTo: "client", position: 7 },
  { title: "Title search & commitment", assignedTo: "title", position: 8 },
  { title: "Final loan approval (clear to close)", assignedTo: "lender", position: 9 },
  { title: "Review closing disclosure", assignedTo: "client", position: 10 },
  { title: "Final walkthrough", assignedTo: "agent", position: 11 },
  { title: "Wire closing funds", assignedTo: "client", position: 12 },
  { title: "Sign closing documents", assignedTo: "client", position: 13 },
  { title: "Record deed & disburse funds", assignedTo: "title", position: 14 },
];

/**
 * GET /api/portal/transactions
 * Returns all transactions for the authenticated user.
 */
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

    const isAgent = user.role === "AGENT" || user.role === "ADMIN";

    const transactions = await prisma.transaction.findMany({
      where: isAgent
        ? { agentId: user.id }
        : { clientId: user.id },
      include: {
        listing: {
          select: { id: true, address: true, city: true, imageUrl: true, priceAmount: true },
        },
        client: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true } },
        milestones: { orderBy: { position: "asc" } },
        tasks: { orderBy: { position: "asc" } },
        documents: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (e) {
    console.error("[transactions] Error:", e);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}

/**
 * POST /api/portal/transactions
 * Create a new transaction with default milestones and tasks.
 */
export async function POST(req: NextRequest) {
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
    const {
      listingId, clientId, propertyAddress, propertyCity, propertyZip,
      type, contractPrice, closeDate, contractDate,
      otherAgentName, otherAgentPhone, titleCompany, lenderName, lenderContact,
    } = body;

    if (!propertyAddress) {
      return NextResponse.json({ error: "propertyAddress required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        agentId: user.id,
        listingId: listingId || null,
        clientId: clientId || null,
        propertyAddress,
        propertyCity: propertyCity || "Austin",
        propertyZip: propertyZip || null,
        type: type || "buy",
        contractPrice: contractPrice ? Number(contractPrice) : null,
        closeDate: closeDate ? new Date(closeDate) : null,
        contractDate: contractDate ? new Date(contractDate) : null,
        otherAgentName, otherAgentPhone, titleCompany, lenderName, lenderContact,
        milestones: {
          create: DEFAULT_MILESTONES.map((m) => ({
            name: m.name,
            position: m.position,
            status: m.position === 0 ? "completed" : "upcoming",
            completedAt: m.position === 0 ? new Date() : null,
          })),
        },
        tasks: {
          create: DEFAULT_TASKS.map((t) => ({
            title: t.title,
            assignedTo: t.assignedTo,
            position: t.position,
          })),
        },
      },
      include: {
        milestones: { orderBy: { position: "asc" } },
        tasks: { orderBy: { position: "asc" } },
      },
    });

    return NextResponse.json({ transaction });
  } catch (e) {
    console.error("[transactions] POST error:", e);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

/**
 * PATCH /api/portal/transactions
 * Update a transaction, milestone, or task.
 * Body: { transactionId, field, value } or { milestoneId, status } or { taskId, status }
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Update milestone status
    if (body.milestoneId) {
      const milestone = await prisma.transactionMilestone.update({
        where: { id: body.milestoneId },
        data: {
          status: body.status,
          completedAt: body.status === "completed" ? new Date() : null,
          notes: body.notes !== undefined ? body.notes : undefined,
        },
      });
      return NextResponse.json({ milestone });
    }

    // Update task status
    if (body.taskId) {
      const task = await prisma.transactionTask.update({
        where: { id: body.taskId },
        data: {
          status: body.status,
          completedAt: body.status === "completed" ? new Date() : null,
        },
      });
      return NextResponse.json({ task });
    }

    // Update transaction fields
    if (body.transactionId) {
      const { transactionId, ...updates } = body;
      const allowed = [
        "status", "contractPrice", "closeDate", "contractDate", "notes",
        "otherAgentName", "otherAgentPhone", "otherAgentEmail",
        "titleCompany", "lenderName", "lenderContact", "inspectorName", "inspectorContact",
        "commissionPct", "commissionFlat", "referralPct",
      ];
      const data: Record<string, unknown> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) {
          if (key === "closeDate" || key === "contractDate") {
            data[key] = updates[key] ? new Date(updates[key]) : null;
          } else if (["contractPrice", "commissionPct", "commissionFlat", "referralPct"].includes(key)) {
            data[key] = updates[key] ? Number(updates[key]) : null;
          } else {
            data[key] = updates[key];
          }
        }
      }

      const transaction = await prisma.transaction.update({
        where: { id: transactionId },
        data,
      });
      return NextResponse.json({ transaction });
    }

    return NextResponse.json({ error: "No valid update target" }, { status: 400 });
  } catch (e) {
    console.error("[transactions] PATCH error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
