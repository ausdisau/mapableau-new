import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10),
  platform: z.enum(["ios", "android", "web"]),
  categories: z.record(z.string(), z.boolean()).optional(),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!remainingSystemsConfig.mobilePushEnabled) {
    return NextResponse.json({ error: "MOBILE_PUSH_DISABLED" }, { status: 503 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.mobilePushToken.upsert({
    where: { token: parsed.data.token },
    create: {
      userId: user.id,
      token: parsed.data.token,
      platform: parsed.data.platform,
      categories: parsed.data.categories,
    },
    update: {
      userId: user.id,
      categories: parsed.data.categories,
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    action: "mobile.push_token_registered",
    entityType: "MobilePushToken",
    entityId: record.id,
  });

  return NextResponse.json({ ok: true });
}
