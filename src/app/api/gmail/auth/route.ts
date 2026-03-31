import { NextResponse } from "next/server";

/**
 * GET /api/gmail/auth
 *
 * One-time OAuth2 authorization flow to get a refresh token for Gmail API.
 * Redirects to Google's consent screen.
 *
 * After authorizing, Google redirects to /api/gmail/callback with a code.
 */

export async function GET() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GMAIL_CLIENT_ID not set" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3001"}/api/gmail/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
