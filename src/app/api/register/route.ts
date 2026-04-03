import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { pushLeadToGHL, buildLeadTags } from "@/lib/ghl";

/**
 * POST /api/register
 *
 * Creates a real User account in the database + pushes to GHL as a lead.
 * Returns the user so the frontend can auto-sign-in.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, password, interest } = body;

    if (!email || !password || !firstName) {
      return NextResponse.json({ error: "Email, password, and first name required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
    }

    // Get or create default tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({ data: { name: "Shapiro Group" } });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName || ""}`.trim(),
        phone: phone || null,
        passwordHash,
        tenantId: tenant.id,
        role: "USER",
      },
    });

    // Push to GHL as a lead
    const tags = buildLeadTags({
      type: interest === "sell" ? "seller" : interest === "invest" ? "investor" : "buyer",
      source: "website_registration",
    });
    tags.push("website", "registered_user");

    pushLeadToGHL({
      firstName,
      lastName,
      email,
      phone,
      source: "website_registration",
      tags,
      customFields: { interest: interest || "buy" },
    }).catch(() => {}); // Don't block on GHL

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    console.error("[register] Error:", e);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
