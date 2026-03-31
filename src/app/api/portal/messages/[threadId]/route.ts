import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/portal/messages/:threadId — Get all messages in a thread
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Verify user is participant
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      listing: {
        select: {
          id: true, address: true, city: true, priceAmount: true,
          beds: true, baths: true, imageUrl: true,
        },
      },
      participants: {
        include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
      },
      messages: {
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Mark as read
  await prisma.threadParticipant.update({
    where: { threadId_userId: { threadId, userId } },
    data: { lastRead: new Date() },
  });

  return NextResponse.json({
    thread: thread ? {
      ...thread,
      listing: thread.listing ? {
        ...thread.listing,
        priceAmount: thread.listing.priceAmount ? Number(thread.listing.priceAmount) : null,
      } : null,
    } : null,
  });
}
