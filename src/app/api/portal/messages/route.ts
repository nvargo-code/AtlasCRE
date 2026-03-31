import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        include: { user: { select: { id: true, name: true, role: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Calculate unread counts
  const threadsWithUnread = threads.map((thread) => {
    const myParticipant = thread.participants.find((p) => p.userId === userId);
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

  // Find existing thread between these users about this listing
  let thread = listingId ? await prisma.messageThread.findFirst({
    where: {
      listingId,
      participants: {
        every: { userId: { in: [userId, recipientId].filter(Boolean) } },
      },
    },
  }) : null;

  if (!thread) {
    // Create new thread
    thread = await prisma.messageThread.create({
      data: {
        listingId: listingId || null,
        subject: subject || null,
        participants: {
          create: [
            { userId, lastRead: new Date() },
            ...(recipientId ? [{ userId: recipientId }] : []),
          ],
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

  return NextResponse.json({ message, threadId: thread.id });
}
