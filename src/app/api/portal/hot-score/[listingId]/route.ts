import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateHotScore } from "@/lib/hot-score";

/**
 * GET /api/portal/hot-score/:listingId — Get hot score for a listing
 *
 * Public endpoint — scores help buyers make decisions.
 * Returns cached score if available, calculates fresh if not.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;

  // Try cached score first
  const cached = await prisma.hotScore.findUnique({
    where: { listingId },
  });

  if (cached) {
    // Return cached if less than 6 hours old
    const age = Date.now() - cached.updatedAt.getTime();
    if (age < 6 * 60 * 60 * 1000) {
      return NextResponse.json({
        score: cached.score,
        signals: cached.signals,
        reasoning: cached.reasoning,
        cached: true,
      });
    }
  }

  // Calculate fresh score
  try {
    const result = await calculateHotScore(listingId);

    // Cache it
    await prisma.hotScore.upsert({
      where: { listingId },
      create: {
        listingId,
        score: result.score,
        signals: result.signals as object,
        reasoning: result.reasoning,
      },
      update: {
        score: result.score,
        signals: result.signals as object,
        reasoning: result.reasoning,
      },
    });

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
