import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();

  // TODO: Send to GoHighLevel webhook with behavioral data
  // const GHL_WEBHOOK = process.env.GHL_LEAD_WEBHOOK;
  // if (GHL_WEBHOOK) {
  //   await fetch(GHL_WEBHOOK, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //       firstName: data.firstName,
  //       lastName: data.lastName,
  //       email: data.email,
  //       phone: data.phone,
  //       source: data.source || "supersearch_gate",
  //       tags: ["supersearch_lead", "website"],
  //       customField: {
  //         leadSource: data.source,
  //         context: data.context,
  //         searchBehavior: data.searchBehavior,
  //       },
  //     }),
  //   });
  // }

  console.log("[Lead Registration]", data);

  return NextResponse.json({ success: true });
}
