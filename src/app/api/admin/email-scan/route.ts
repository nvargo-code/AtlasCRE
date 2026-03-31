import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emails = await prisma.processedEmail.findMany({
    orderBy: { processedAt: "desc" },
    take: 200,
    select: {
      id: true,
      gmailMessageId: true,
      from: true,
      subject: true,
      receivedAt: true,
      processedAt: true,
      isPocketListing: true,
      confidence: true,
      keywords: true,
      mlsNumber: true,
      status: true,
      listingId: true,
      errorMessage: true,
    },
  });

  return NextResponse.json({ emails });
}
