import { NextResponse } from "next/server";
import { z } from "zod";

import {
  assertNoForbiddenTargeting,
  buildSafeAdContext,
} from "@/lib/ads/ad-slot-policy";
import { prisma } from "@/lib/prisma";

const eventSchema = z.object({
  eventType: z.enum(["impression", "click", "hidden", "reported"]),
  slotId: z.string().min(1).max(120),
  side: z.enum(["left", "right"]).optional(),
  pageContext: z.string().min(1).max(80),
  creativeId: z.string().max(120).optional(),
  context: z
    .object({
      pageContext: z.string().max(80),
      serviceCategory: z.string().max(80).optional(),
      region: z.string().max(80).optional(),
      providerCategory: z.string().max(80).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  try {
    assertNoForbiddenTargeting(parsed.data as unknown as Record<string, unknown>);
    if (parsed.data.context) {
      assertNoForbiddenTargeting(
        parsed.data.context as unknown as Record<string, unknown>,
      );
      buildSafeAdContext(parsed.data.context);
    }
  } catch {
    return NextResponse.json({ error: "Invalid targeting context" }, { status: 400 });
  }

  try {
    await prisma.auditEvent.create({
      data: {
        action: `ad.${parsed.data.eventType}`,
        entityType: "ad_event",
        entityId: parsed.data.slotId,
        metadata: {
          side: parsed.data.side,
          pageContext: parsed.data.pageContext,
          creativeId: parsed.data.creativeId,
          context: parsed.data.context,
        },
      },
    });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true, stored: true });
}
