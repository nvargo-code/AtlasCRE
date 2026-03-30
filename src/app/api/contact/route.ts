import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();

  // TODO: Send to GoHighLevel webhook
  // const GHL_WEBHOOK = process.env.GHL_CONTACT_WEBHOOK;
  // if (GHL_WEBHOOK) {
  //   await fetch(GHL_WEBHOOK, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //       firstName: data.firstName,
  //       lastName: data.lastName,
  //       email: data.email,
  //       phone: data.phone,
  //       source: "website_contact_form",
  //       tags: [data.interest],
  //       customField: { message: data.message },
  //     }),
  //   });
  // }

  console.log("[Contact Form]", data);

  return NextResponse.json({ success: true });
}
