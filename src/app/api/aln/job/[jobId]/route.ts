import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SCRAPER_URL = process.env.SCRAPER_SERVICE_URL ?? "http://134.209.172.184:3333";
const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? "";

const headers = { Authorization: `Bearer ${SCRAPER_SECRET}` };

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${SCRAPER_URL}/scrape/aln/job/${params.jobId}`, {
    headers,
    signal: AbortSignal.timeout(5_000),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: "Failed to get job status" }, { status: 502 });
  return NextResponse.json(await res.json());
}
