/**
 * Saved Search Alert Matcher
 *
 * Checks new listings against all saved searches and generates
 * notifications for matching results. Used by the cron job to
 * send daily/weekly alert digests.
 */

import { prisma } from "./prisma";
import { buildListingWhere } from "./filters";
import { ListingFilters } from "@/types";

interface AlertMatch {
  searchId: string;
  searchName: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  matchCount: number;
  matches: {
    id: string;
    address: string;
    city: string;
    priceAmount: number | null;
    beds: number | null;
    baths: number | null;
    buildingSf: number | null;
    imageUrl: string | null;
    listingType: string;
  }[];
}

/**
 * Find new listings matching each saved search since the last alert.
 * Groups results by user for email digest generation.
 */
export async function findAlertMatches(frequency: "daily" | "weekly" | "instant"): Promise<{
  alerts: AlertMatch[];
  searchesChecked: number;
  totalMatches: number;
}> {
  // Determine the lookback window
  const now = new Date();
  const lookbackHours = frequency === "instant" ? 1 : frequency === "daily" ? 24 : 168;
  const since = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);

  // Get all saved searches with matching frequency that are due for an alert
  const searches = await prisma.savedSearch.findMany({
    where: {
      alertEnabled: true,
      alertFrequency: frequency,
      OR: [
        { lastAlertAt: null },
        { lastAlertAt: { lt: since } },
      ],
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const alerts: AlertMatch[] = [];
  let totalMatches = 0;

  for (const search of searches) {
    try {
      const filters = search.filters as unknown as ListingFilters;

      // Build the where clause from saved filters
      const where = buildListingWhere(filters);

      // Only find listings created since the last alert
      const createdSince = search.lastAlertAt || since;

      const newListings = await prisma.listing.findMany({
        where: {
          ...where,
          createdAt: { gt: createdSince },
        },
        select: {
          id: true,
          address: true,
          city: true,
          priceAmount: true,
          beds: true,
          baths: true,
          buildingSf: true,
          imageUrl: true,
          listingType: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

      if (newListings.length > 0) {
        alerts.push({
          searchId: search.id,
          searchName: search.name,
          userId: search.user.id,
          userEmail: search.user.email,
          userName: search.user.name,
          matchCount: newListings.length,
          matches: newListings.map((l) => ({
            ...l,
            priceAmount: l.priceAmount ? Number(l.priceAmount) : null,
            buildingSf: l.buildingSf ? Number(l.buildingSf) : null,
          })),
        });
        totalMatches += newListings.length;
      }

      // Update last alert timestamp and match count
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: {
          lastAlertAt: now,
          lastMatchCount: newListings.length,
        },
      });
    } catch (e) {
      console.error(`[search-alerts] Error processing search ${search.id}:`, e);
    }
  }

  return { alerts, searchesChecked: searches.length, totalMatches };
}

/**
 * Group alerts by user email for digest-style notifications.
 */
export function groupAlertsByUser(alerts: AlertMatch[]): Map<string, {
  email: string;
  name: string | null;
  searches: AlertMatch[];
  totalMatches: number;
}> {
  const grouped = new Map<string, {
    email: string;
    name: string | null;
    searches: AlertMatch[];
    totalMatches: number;
  }>();

  for (const alert of alerts) {
    const existing = grouped.get(alert.userEmail);
    if (existing) {
      existing.searches.push(alert);
      existing.totalMatches += alert.matchCount;
    } else {
      grouped.set(alert.userEmail, {
        email: alert.userEmail,
        name: alert.userName,
        searches: [alert],
        totalMatches: alert.matchCount,
      });
    }
  }

  return grouped;
}

/**
 * Generate HTML email body for an alert digest.
 */
export function generateAlertEmail(
  userName: string | null,
  searches: AlertMatch[],
  baseUrl: string
): { subject: string; html: string } {
  const totalMatches = searches.reduce((sum, s) => sum + s.matchCount, 0);
  const subject = `${totalMatches} new listing${totalMatches !== 1 ? "s" : ""} match your saved searches — Shapiro Group`;

  const searchSections = searches.map((search) => {
    const listingRows = search.matches.slice(0, 5).map((listing) => {
      const price = listing.priceAmount
        ? listing.priceAmount >= 1_000_000
          ? `$${(listing.priceAmount / 1_000_000).toFixed(1)}M`
          : `$${Math.round(listing.priceAmount / 1_000)}K`
        : "Contact for Price";
      const details = [
        listing.beds ? `${listing.beds} bed` : "",
        listing.baths ? `${listing.baths} bath` : "",
        listing.buildingSf ? `${listing.buildingSf.toLocaleString()} SF` : "",
      ].filter(Boolean).join(" · ");

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
            <a href="${baseUrl}/listings/${listing.id}" style="color: #0a1628; text-decoration: none;">
              <strong style="font-size: 16px;">${price}</strong><br/>
              <span style="color: #555; font-size: 14px;">${listing.address}, ${listing.city}</span><br/>
              <span style="color: #999; font-size: 12px;">${details}</span>
            </a>
          </td>
        </tr>`;
    }).join("");

    const moreCount = search.matchCount - 5;

    return `
      <div style="margin-bottom: 32px;">
        <h3 style="color: #c9a96e; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
          ${search.searchName}
        </h3>
        <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
          ${search.matchCount} new listing${search.matchCount !== 1 ? "s" : ""} found
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          ${listingRows}
        </table>
        ${moreCount > 0 ? `<p style="margin-top: 12px;"><a href="${baseUrl}/search" style="color: #c9a96e; font-size: 13px;">See ${moreCount} more →</a></p>` : ""}
      </div>`;
  }).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f8f6;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background-color: #0a1628; padding: 32px; text-align: center;">
          <img src="${baseUrl}/images/logos/sg-horizontal-white.png" alt="Shapiro Group" style="height: 32px;" />
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <p style="color: #0a1628; font-size: 18px; margin-bottom: 4px;">
            Hi ${userName || "there"},
          </p>
          <p style="color: #666; font-size: 15px; margin-bottom: 32px;">
            We found <strong>${totalMatches} new listing${totalMatches !== 1 ? "s" : ""}</strong> matching your saved searches.
          </p>

          ${searchSections}

          <!-- CTA -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${baseUrl}/search" style="background-color: #c9a96e; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Search All Listings
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f8f6; padding: 24px 32px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Shapiro Group · Austin, TX<br/>
            <a href="${baseUrl}/portal/saved-searches" style="color: #c9a96e;">Manage alert preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>`;

  return { subject, html };
}
