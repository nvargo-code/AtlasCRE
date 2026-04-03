import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.string(), z.unknown()),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(searches);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const search = await prisma.savedSearch.create({
    data: {
      userId,
      name: parsed.data.name,
      filters: parsed.data.filters as Record<string, string | number | boolean | null>,
    },
  });

  return NextResponse.json(search, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const { id, alertEnabled, alertFrequency } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.savedSearch.updateMany({
    where: { id, userId },
    data: {
      ...(alertEnabled !== undefined ? { alertEnabled } : {}),
      ...(alertFrequency ? { alertFrequency } : {}),
    },
  });

  return NextResponse.json({ ok: true, updated: updated.count });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await req.json();

  await prisma.savedSearch.deleteMany({
    where: { id, userId },
  });

  return NextResponse.json({ ok: true });
}
