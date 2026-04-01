import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;

  const events = await prisma.priceHistory.findMany({
    where: { listingId },
    orderBy: { changeDate: "desc" },
  });

  return NextResponse.json({ events });
}
