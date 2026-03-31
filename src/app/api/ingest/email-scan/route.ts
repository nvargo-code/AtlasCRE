import { NextRequest, NextResponse } from "next/server";
import { scanGmailForPocketListings } from "@/ingestion/gmail-scanner";

/**
 * GET /api/ingest/email-scan
 *
 * Triggered by Vercel Cron 4x daily (every 6 hours).
 * Scans Gmail for pocket listing emails and ingests them.
 *
 * Add to vercel.json:
 * {
 *   "crons": [
 *     { "path": "/api/ingest/email-scan", "schedule": "0 0,6,12,18 * * *" }
 *   ]
 * }
 */

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("[email-scan] Starting scheduled Gmail scan...");

  const result = await scanGmailForPocketListings();

  return NextResponse.json({
    success: true,
    ...result,
  });
}

/**
 * POST /api/ingest/email-scan
 *
 * Manual trigger (admin only).
 */
export async function POST() {
  console.log("[email-scan] Manual Gmail scan triggered...");
  const result = await scanGmailForPocketListings();
  return NextResponse.json({ success: true, ...result });
}
