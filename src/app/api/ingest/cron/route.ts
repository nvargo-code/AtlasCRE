import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/ingestion/runner";

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runIngestion({});
  return NextResponse.json(result);
}
