import { NextResponse } from "next/server";
import { pushLeadToGHL } from "@/lib/ghl";

export async function POST(request: Request) {
  const data = await request.json();

  console.log("[Contact Form]", data.email);

  // Push to GoHighLevel CRM
  const tags = ["website", "contact_form"];
  if (data.interest) tags.push(data.interest);

  await pushLeadToGHL({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    source: "website_contact_form",
    tags,
    customFields: {
      ...(data.message ? { message: data.message } : {}),
      ...(data.interest ? { interest: data.interest } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
