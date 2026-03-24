import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runIngestion } from "@/ingestion/runner";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const provider = body.provider as string | undefined;
  const market = body.market as string | undefined;

  const result = await runIngestion({ provider, market });

  return NextResponse.json(result);
}
