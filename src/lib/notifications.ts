/**
 * Notification Helper
 *
 * Creates in-app notifications for various events.
 * Used by API routes, cron jobs, and webhooks.
 */

import { prisma } from "./prisma";

type NotificationType =
  | "new_listing_match"
  | "showing_confirmed"
  | "showing_completed"
  | "message"
  | "price_change"
  | "milestone"
  | "system";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body || null,
      link: params.link || null,
      metadata: params.metadata ? (params.metadata as object) : undefined,
    },
  });
}

/**
 * Notify user about new listing matches from their saved searches.
 */
export async function notifyNewListingMatch(
  userId: string,
  searchName: string,
  matchCount: number,
  searchId: string
) {
  return createNotification({
    userId,
    type: "new_listing_match",
    title: `${matchCount} new listing${matchCount !== 1 ? "s" : ""} match "${searchName}"`,
    body: `We found ${matchCount} new properties matching your saved search.`,
    link: "/portal/saved-searches",
    metadata: { searchId, matchCount },
  });
}

/**
 * Notify client when their showing is confirmed.
 */
export async function notifyShowingConfirmed(
  clientId: string,
  listingAddress: string,
  date: string
) {
  return createNotification({
    userId: clientId,
    type: "showing_confirmed",
    title: `Showing confirmed: ${listingAddress}`,
    body: `Your tour of ${listingAddress} is confirmed for ${date}.`,
    link: "/portal/showings",
  });
}

/**
 * Notify user about a new message.
 */
export async function notifyNewMessage(
  userId: string,
  senderName: string,
  threadId: string,
  preview: string
) {
  return createNotification({
    userId,
    type: "message",
    title: `New message from ${senderName}`,
    body: preview.slice(0, 100),
    link: "/portal/messages",
    metadata: { threadId },
  });
}

/**
 * Notify user about a price change on a saved listing.
 */
export async function notifyPriceChange(
  userId: string,
  listingAddress: string,
  listingId: string,
  oldPrice: string,
  newPrice: string
) {
  return createNotification({
    userId,
    type: "price_change",
    title: `Price changed: ${listingAddress}`,
    body: `${oldPrice} → ${newPrice}`,
    link: `/listings/${listingId}`,
    metadata: { listingId, oldPrice, newPrice },
  });
}

/**
 * Notify about a transaction milestone completion.
 */
export async function notifyMilestone(
  userId: string,
  milestoneName: string,
  propertyAddress: string,
  transactionId: string
) {
  return createNotification({
    userId,
    type: "milestone",
    title: `Milestone complete: ${milestoneName}`,
    body: `${propertyAddress} — ${milestoneName} has been completed.`,
    link: "/portal/transactions",
    metadata: { transactionId },
  });
}
