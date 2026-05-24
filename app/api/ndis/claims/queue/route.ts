import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { createClaimDraft } from "@/lib/ndis/ndis-claim-queue-service";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  participantId: z.string(),
  organisationId: z.string(),
  invoiceRef: z.string().optional(),
  serviceLogRef: z.string().optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const claims = await prisma.ndisClaimQueueItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ claims });
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const claim = await createClaimDraft({
    ...parsed.data,
    actorId: user.id,
  });

  return NextResponse.json({ claim }, { status: 201 });
}
