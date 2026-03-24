import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SCRAPER_URL = process.env.SCRAPER_SERVICE_URL ?? "http://134.209.172.184:3333";
const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? "";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${SCRAPER_URL}/2fa/aln/pending`, {
    headers: { Authorization: `Bearer ${SCRAPER_SECRET}` },
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ pending: false });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await req.json();
  const res = await fetch(`${SCRAPER_URL}/2fa/aln`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SCRAPER_SECRET}`,
    },
    body: JSON.stringify({ code }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: "Failed to send code" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
