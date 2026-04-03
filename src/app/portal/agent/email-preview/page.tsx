"use client";

import { useState } from "react";

export default function EmailPreviewPage() {
  const [previewType, setPreviewType] = useState<"alert" | "welcome" | "showing">("alert");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://supersearch-production.up.railway.app";

  const templates: Record<string, { subject: string; html: string }> = {
    alert: {
      subject: "3 new listings match your saved searches — Shapiro Group",
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #0a1628; padding: 32px; text-align: center;">
            <img src="${baseUrl}/images/logos/sg-horizontal-white.png" alt="Shapiro Group" style="height: 32px;" />
          </div>
          <div style="padding: 32px;">
            <p style="color: #0a1628; font-size: 18px; margin-bottom: 4px;">Hi John,</p>
            <p style="color: #666; font-size: 15px; margin-bottom: 32px;">We found <strong>3 new listings</strong> matching your saved searches.</p>
            <div style="margin-bottom: 32px;">
              <h3 style="color: #c9a96e; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">South Austin Homes</h3>
              <p style="color: #666; font-size: 14px; margin-bottom: 16px;">3 new listings found</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><a href="#" style="color: #0a1628; text-decoration: none;"><strong style="font-size: 16px;">$485,000</strong><br/><span style="color: #555; font-size: 14px;">123 Oak Lane, Austin</span><br/><span style="color: #999; font-size: 12px;">3 bed · 2 bath · 1,850 SF</span></a></td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><a href="#" style="color: #0a1628; text-decoration: none;"><strong style="font-size: 16px;">$525,000</strong><br/><span style="color: #555; font-size: 14px;">456 Elm St, Austin</span><br/><span style="color: #999; font-size: 12px;">4 bed · 2.5 bath · 2,200 SF</span></a></td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><a href="#" style="color: #0a1628; text-decoration: none;"><strong style="font-size: 16px;">$399,000</strong><br/><span style="color: #555; font-size: 14px;">789 Pine Ave, Austin</span><br/><span style="color: #999; font-size: 12px;">2 bed · 2 bath · 1,100 SF</span></a></td></tr>
              </table>
            </div>
            <div style="text-align: center; margin-top: 32px;">
              <a href="#" style="background-color: #c9a96e; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Search All Listings</a>
            </div>
          </div>
          <div style="background-color: #f8f8f6; padding: 24px 32px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">Shapiro Group · Austin, TX<br/><a href="#" style="color: #c9a96e;">Manage alert preferences</a></p>
          </div>
        </div>`,
    },
    welcome: {
      subject: "Welcome to SuperSearch — Shapiro Group",
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #0a1628; padding: 32px; text-align: center;">
            <img src="${baseUrl}/images/logos/sg-horizontal-white.png" alt="Shapiro Group" style="height: 32px;" />
          </div>
          <div style="padding: 32px;">
            <p style="color: #0a1628; font-size: 20px; font-weight: 600; margin-bottom: 8px;">Welcome to SuperSearch!</p>
            <p style="color: #666; font-size: 15px; margin-bottom: 24px;">Your account is ready. Here's what you can do:</p>
            <div style="margin-bottom: 24px;">
              <div style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; gap: 12px;"><span style="color: #c9a96e; font-weight: bold;">1.</span> <span style="color: #333;">Search from more sources than Zillow</span></div>
              <div style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; gap: 12px;"><span style="color: #c9a96e; font-weight: bold;">2.</span> <span style="color: #333;">Save homes and create collections</span></div>
              <div style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; gap: 12px;"><span style="color: #c9a96e; font-weight: bold;">3.</span> <span style="color: #333;">Get instant alerts when new homes match</span></div>
              <div style="padding: 12px 0; display: flex; gap: 12px;"><span style="color: #c9a96e; font-weight: bold;">4.</span> <span style="color: #333;">Message your agent directly</span></div>
            </div>
            <div style="text-align: center; margin-top: 32px;">
              <a href="#" style="background-color: #c9a96e; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Start Searching</a>
            </div>
          </div>
          <div style="background-color: #f8f8f6; padding: 24px 32px; text-align: center;">
            <p style="color: #999; font-size: 12px;">Shapiro Group · Austin, TX</p>
          </div>
        </div>`,
    },
    showing: {
      subject: "Showing Confirmed: 123 Oak Lane — Shapiro Group",
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #0a1628; padding: 32px; text-align: center;">
            <img src="${baseUrl}/images/logos/sg-horizontal-white.png" alt="Shapiro Group" style="height: 32px;" />
          </div>
          <div style="padding: 32px;">
            <p style="color: #0a1628; font-size: 18px;">Hi John,</p>
            <p style="color: #666; font-size: 15px; margin-bottom: 24px;">Your showing has been confirmed!</p>
            <div style="background: #f8f8f6; padding: 24px; border-left: 3px solid #c9a96e; margin-bottom: 24px;">
              <p style="color: #0a1628; font-size: 18px; font-weight: 600; margin: 0 0 8px;">123 Oak Lane, Austin TX 78704</p>
              <p style="color: #c9a96e; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Saturday, April 5 · 2:00 PM</p>
              <p style="color: #666; font-size: 14px; margin: 0;">$485,000 · 3 bed · 2 bath · 1,850 SF</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 8px;"><strong>Your Agent:</strong> David Shapiro</p>
            <p style="color: #666; font-size: 14px;">David will meet you at the property. If you need to reschedule, reply to this email or call 512-537-6023.</p>
          </div>
          <div style="background-color: #f8f8f6; padding: 24px 32px; text-align: center;">
            <p style="color: #999; font-size: 12px;">Shapiro Group · Austin, TX</p>
          </div>
        </div>`,
    },
  };

  const current = templates[previewType];

  return (
    <div className="p-6 md:p-10 max-w-[1000px] mx-auto">
      <div className="mb-8">
        <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Email <span className="font-semibold">Templates</span>
        </h1>
        <p className="text-mid-gray text-sm mt-2">Preview what clients see when they receive emails from SuperSearch.</p>
      </div>

      {/* Template selector */}
      <div className="flex gap-2 mb-6">
        {([
          { key: "alert" as const, label: "Listing Alert" },
          { key: "welcome" as const, label: "Welcome" },
          { key: "showing" as const, label: "Showing Confirmed" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setPreviewType(t.key)}
            className={`px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
              previewType === t.key ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:text-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Subject line */}
      <div className="bg-warm-gray p-4 mb-2">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-mid-gray mb-1">Subject</p>
        <p className="text-sm text-navy font-medium">{current.subject}</p>
      </div>

      {/* Email preview */}
      <div className="border border-navy/10 bg-white">
        <div dangerouslySetInnerHTML={{ __html: current.html }} />
      </div>
    </div>
  );
}
