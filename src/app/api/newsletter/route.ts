import { NextResponse } from "next/server";
import { pushLeadToGHL } from "@/lib/ghl";

export async function POST(request: Request) {
  const data = await request.json();

  console.log("[Newsletter Signup]", data.email);

  await pushLeadToGHL({
    email: data.email,
    source: "newsletter_signup",
    tags: ["newsletter", "website"],
  });

  return NextResponse.json({ success: true });
}
