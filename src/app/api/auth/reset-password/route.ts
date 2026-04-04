import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password
 *
 * For now: generates a new random password and logs it.
 * In production: should send a reset email with a token link.
 *
 * If RESEND_API_KEY is configured, sends actual email.
 * Otherwise, resets to a known password and logs it for manual handoff.
 */

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a temporary password
    const tempPassword = `Reset${Date.now().toString(36).slice(-6)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Send email with the new password
    if (process.env.RESEND_API_KEY) {
      const baseUrl = process.env.NEXTAUTH_URL || "https://supersearch-production.up.railway.app";
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Shapiro Group <noreply@shapirogroup.co>",
            to: email,
            subject: "Your Password Has Been Reset — Shapiro Group",
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
                <div style="background: #0a1628; padding: 24px; text-align: center;">
                  <img src="${baseUrl}/images/logos/sg-horizontal-white.png" alt="Shapiro Group" style="height: 32px;" />
                </div>
                <div style="padding: 32px;">
                  <p style="color: #0a1628; font-size: 16px;">Hi ${user.name || "there"},</p>
                  <p style="color: #666; font-size: 14px;">Your password has been reset. Here's your temporary password:</p>
                  <div style="background: #f8f8f6; padding: 16px; text-align: center; margin: 24px 0; border-left: 3px solid #c9a96e;">
                    <code style="font-size: 20px; color: #0a1628; font-weight: bold;">${tempPassword}</code>
                  </div>
                  <p style="color: #666; font-size: 14px;">Sign in at <a href="${baseUrl}/login" style="color: #c9a96e;">${baseUrl}/login</a> with this password, then change it in Settings.</p>
                </div>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error("[reset-password] Email send error:", e);
      }
    } else {
      // No email provider — log for manual handoff
      console.log(`[reset-password] Password reset requested for ${email} (configure RESEND_API_KEY to send email)`);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[reset-password] Error:", e);
    return NextResponse.json({ error: "Failed to process reset" }, { status: 500 });
  }
}
