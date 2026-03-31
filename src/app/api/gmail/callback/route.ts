import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/gmail/callback
 *
 * OAuth2 callback from Google. Exchanges the auth code for tokens.
 * Displays the refresh token so you can copy it into GMAIL_REFRESH_TOKEN env var.
 */

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No authorization code received" }, { status: 400 });
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3001"}/api/gmail/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Gmail OAuth credentials not set" }, { status: 500 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    return NextResponse.json({ error: `Token exchange failed: ${error}` }, { status: 500 });
  }

  const tokens = await tokenRes.json();

  // Display the refresh token for the user to copy
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Gmail Connected</title></head>
    <body style="font-family:system-ui;max-width:600px;margin:80px auto;padding:20px">
      <h1 style="color:#0A1628">Gmail Connected</h1>
      <p>Copy this refresh token and set it as <code>GMAIL_REFRESH_TOKEN</code> in your environment variables:</p>
      <pre style="background:#f5f3ef;padding:16px;overflow-x:auto;border:1px solid #ddd;font-size:13px">${tokens.refresh_token || "No refresh token returned — try revoking access at myaccount.google.com and re-authorizing"}</pre>
      <p style="color:#9a9a9a;font-size:13px">This token allows the email scanner to read your Gmail. It only has <code>gmail.readonly</code> permission — it cannot send emails or modify your inbox.</p>
      <a href="/admin" style="color:#C9A96E">Back to Admin</a>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
