import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/settings
 * Returns user profile + notification preferences.
 *
 * PATCH /api/portal/settings
 * Updates user profile and/or notification preferences.
 * Preferences are stored in the User's metadata or a separate field.
 * For now we store alert preferences on all SavedSearches.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get alert preferences from saved searches (global frequency)
    const searches = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      select: { alertEnabled: true, alertFrequency: true },
      take: 1,
    });

    const defaultFrequency = searches[0]?.alertFrequency || "daily";
    const alertsEnabled = searches[0]?.alertEnabled ?? true;

    return NextResponse.json({
      user,
      preferences: {
        emailAlerts: alertsEnabled,
        alertFrequency: defaultFrequency,
      },
    });
  } catch (e) {
    console.error("[settings] Error:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();

    // Update user profile fields
    if (body.name !== undefined || body.phone !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.phone !== undefined ? { phone: body.phone } : {}),
        },
      });
    }

    // Update alert preferences on all saved searches
    if (body.emailAlerts !== undefined || body.alertFrequency !== undefined) {
      await prisma.savedSearch.updateMany({
        where: { userId: user.id },
        data: {
          ...(body.emailAlerts !== undefined ? { alertEnabled: body.emailAlerts } : {}),
          ...(body.alertFrequency !== undefined ? { alertFrequency: body.alertFrequency } : {}),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[settings] PATCH error:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
