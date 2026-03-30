import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();

  // TODO: Send to GoHighLevel or email marketing platform
  // const GHL_WEBHOOK = process.env.GHL_NEWSLETTER_WEBHOOK;
  // if (GHL_WEBHOOK) {
  //   await fetch(GHL_WEBHOOK, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //       email: data.email,
  //       source: "newsletter_signup",
  //       tags: ["newsletter", "website"],
  //     }),
  //   });
  // }

  console.log("[Newsletter Signup]", data);

  return NextResponse.json({ success: true });
}
