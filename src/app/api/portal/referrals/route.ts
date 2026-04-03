import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

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

    const referrals = await prisma.referral.findMany({
      where: user.role === "ADMIN" ? {} : { receivingAgentId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: referrals.length,
      active: referrals.filter((r) => ["received", "contacted", "active"].includes(r.status)).length,
      closed: referrals.filter((r) => r.status === "closed").length,
      totalPaid: referrals.reduce((s, r) => s + (r.paidAmount ? Number(r.paidAmount) : 0), 0),
      pendingFees: referrals
        .filter((r) => r.status === "closed" && !r.paidAmount)
        .reduce((s, r) => {
          const price = r.closedPrice ? Number(r.closedPrice) : 0;
          const fee = r.referralFee ? Number(r.referralFee) : 25;
          return s + price * 0.03 * (fee / 100); // Assume 3% commission, then referral % of that
        }, 0),
    };

    return NextResponse.json({ referrals, stats });
  } catch (e) {
    console.error("[referrals] Error:", e);
    return NextResponse.json({ error: "Failed to load referrals" }, { status: 500 });
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
      select: { id: true, role: true },
    });
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }

    const body = await req.json();
    const referral = await prisma.referral.create({
      data: {
        receivingAgentId: user.id,
        referringAgent: body.referringAgent,
        referringBrokerage: body.referringBrokerage || null,
        referringEmail: body.referringEmail || null,
        referringPhone: body.referringPhone || null,
        clientName: body.clientName,
        clientEmail: body.clientEmail || null,
        clientPhone: body.clientPhone || null,
        clientType: body.clientType || "buyer",
        referralFee: body.referralFee ? Number(body.referralFee) : 25,
        estimatedPrice: body.estimatedPrice ? Number(body.estimatedPrice) : null,
        market: body.market || "austin",
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ referral });
  } catch (e) {
    console.error("[referrals] POST error:", e);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, closedPrice, paidAmount, paidDate, notes } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const referral = await prisma.referral.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(closedPrice !== undefined ? { closedPrice: closedPrice ? Number(closedPrice) : null } : {}),
        ...(paidAmount !== undefined ? { paidAmount: paidAmount ? Number(paidAmount) : null } : {}),
        ...(paidDate ? { paidDate: new Date(paidDate) } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    return NextResponse.json({ referral });
  } catch (e) {
    console.error("[referrals] PATCH error:", e);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}
