import { NextRequest, NextResponse } from "next/server";
import { findAlertMatches, groupAlertsByUser, generateAlertEmail } from "@/lib/search-alerts";
import { notifyNewListingMatch } from "@/lib/notifications";

/**
 * GET /api/alerts/cron
 *
 * Cron job that runs daily to check saved searches for new matching listings.
 * Generates email digests for users with matches.
 *
 * For now, logs the alerts. Email sending integration (SendGrid/Resend/etc.)
 * can be plugged in by replacing the console.log with the email provider API.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run daily alerts
    const dailyResult = await findAlertMatches("daily");

    // Create in-app notifications for each alert
    for (const alert of dailyResult.alerts) {
      try {
        await notifyNewListingMatch(alert.userId, alert.searchName, alert.matchCount, alert.searchId);
      } catch {
        // Don't fail the cron if notification creation fails
      }
    }

    // Group by user for email digests
    const userDigests = groupAlertsByUser(dailyResult.alerts);

    const baseUrl = process.env.NEXTAUTH_URL || "https://shapirogroup.co";
    const emailsSent: string[] = [];

    for (const [email, digest] of userDigests) {
      const { subject, html } = generateAlertEmail(digest.name, digest.searches, baseUrl);

      // TODO: Replace with actual email provider (SendGrid, Resend, etc.)
      // For now, log the alert so we can verify it's working
      if (process.env.RESEND_API_KEY) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Shapiro Group <alerts@shapirogroup.co>",
              to: email,
              subject,
              html,
            }),
          });
          if (res.ok) emailsSent.push(email);
          else console.error(`[alerts] Failed to send to ${email}:`, await res.text());
        } catch (e) {
          console.error(`[alerts] Email send error for ${email}:`, e);
        }
      } else {
        // No email provider configured — log for debugging
        console.log(`[alerts] Would send to ${email}: "${subject}" (${digest.totalMatches} matches across ${digest.searches.length} searches)`);
        emailsSent.push(`${email} (logged)`);
      }
    }

    return NextResponse.json({
      success: true,
      searchesChecked: dailyResult.searchesChecked,
      totalMatches: dailyResult.totalMatches,
      alertsGenerated: dailyResult.alerts.length,
      emailsSent: emailsSent.length,
      recipients: emailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[alerts] Cron error:", e);
    return NextResponse.json({ error: "Alert cron failed" }, { status: 500 });
  }
}
