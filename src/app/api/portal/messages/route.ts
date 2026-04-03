import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewMessage } from "@/lib/notifications";

// GET /api/portal/messages — List user's message threads
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const threads = await prisma.messageThread.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      listing: { select: { id: true, address: true, city: true, imageUrl: true, priceAmount: true } },
      participants: {
        include: { user: { select: { id: true, name: true, email: true, role: true, phone: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Calculate unread counts and identify the "other person" in each thread
  const threadsWithUnread = threads.map((thread) => {
    const myParticipant = thread.participants.find((p) => p.userId === userId);
    const otherParticipant = thread.participants.find((p) => p.userId !== userId);
    const lastRead = myParticipant?.lastRead;
    const lastMessage = thread.messages[0];
    const hasUnread = lastMessage && lastRead ? lastMessage.createdAt > lastRead : !!lastMessage;

    return {
      ...thread,
      listing: thread.listing ? {
        ...thread.listing,
        priceAmount: thread.listing.priceAmount ? Number(thread.listing.priceAmount) : null,
      } : null,
      hasUnread,
      lastMessage: lastMessage || null,
      otherPerson: otherParticipant?.user || null,
    };
  });

  return NextResponse.json({ threads: threadsWithUnread });
}

// POST /api/portal/messages — Create a new thread or send a message
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { recipientId, listingId, subject, body } = await req.json();

  if (!body) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  // Determine the recipient
  let finalRecipientId = recipientId;

  if (!finalRecipientId) {
    // Auto-find the assigned agent for this client
    const relationship = await prisma.agentClient.findFirst({
      where: { clientId: userId, status: "active" },
      select: { agentId: true },
    });

    if (relationship) {
      finalRecipientId = relationship.agentId;
    } else {
      // No assigned agent — find first available agent/admin
      const defaultAgent = await prisma.user.findFirst({
        where: { role: { in: ["AGENT", "ADMIN"] } },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      if (defaultAgent) finalRecipientId = defaultAgent.id;
    }
  }

  // Find existing thread between these users about this listing
  let thread = null;
  if (listingId && finalRecipientId) {
    thread = await prisma.messageThread.findFirst({
      where: {
        listingId,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: finalRecipientId } } },
        ],
      },
    });
  } else if (finalRecipientId) {
    // Find any existing direct thread between these two users (no listing)
    thread = await prisma.messageThread.findFirst({
      where: {
        listingId: null,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: finalRecipientId } } },
        ],
      },
    });
  }

  if (!thread) {
    // Create new thread with both participants
    const participants = [
      { userId, lastRead: new Date() },
    ];
    if (finalRecipientId && finalRecipientId !== userId) {
      participants.push({ userId: finalRecipientId, lastRead: new Date(0) });
    }

    thread = await prisma.messageThread.create({
      data: {
        listingId: listingId || null,
        subject: subject || null,
        participants: {
          create: participants,
        },
      },
    });
  }

  // Send message
  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      senderId: userId,
      body,
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Update thread's lastMessageAt and sender's lastRead
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date() },
  });
  await prisma.threadParticipant.updateMany({
    where: { threadId: thread.id, userId },
    data: { lastRead: new Date() },
  });

  // Notify the recipient
  if (finalRecipientId) {
    const senderName = (session.user as { name?: string }).name || "Someone";
    notifyNewMessage(finalRecipientId, senderName, thread.id, body.slice(0, 100)).catch(() => {});
  }

  return NextResponse.json({ message, threadId: thread.id });
}
