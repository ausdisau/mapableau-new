import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { isSameOriginMutation } from "@/lib/provider/finder/personalisation/origin";

const preferenceSchema = z.object({
  enabled: z.boolean(),
  location: z.string().trim().max(80).nullable().optional(),
  supportType: z.string().trim().max(80).nullable().optional(),
  language: z.string().trim().max(60).nullable().optional(),
}).strict();

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const saved = await prisma.providerFinderPreference.findUnique({
    where: { userId: user.id },
    select: {
      enabled: true,
      location: true,
      supportType: true,
      language: true,
      updatedAt: true,
    },
  });
  return Response.json({
    preferences: saved ?? {
      enabled: false, location: null, supportType: null, language: null, updatedAt: null,
    },
  }, { headers: noStore });
}

export async function PUT(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isSameOriginMutation(request)) {
    return Response.json({ error: "Cross-origin preference update blocked." }, { status: 403 });
  }
  const raw: unknown = await request.json().catch(() => null);
  const parsed = preferenceSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Invalid preference fields." }, { status: 400 });

  if (!parsed.data.enabled) {
    await prisma.providerFinderPreference.deleteMany({ where: { userId: user.id } });
  } else {
    await prisma.providerFinderPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        enabled: true,
        location: parsed.data.location || null,
        supportType: parsed.data.supportType || null,
        language: parsed.data.language || null,
      },
      update: {
        enabled: true,
        location: parsed.data.location || null,
        supportType: parsed.data.supportType || null,
        language: parsed.data.language || null,
      },
    });
  }

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: parsed.data.enabled ? "finder.preferences.enabled" : "finder.preferences.erased",
    entityType: "ProviderFinderPreference",
    entityId: user.id,
    participantId: user.id,
  });

  return Response.json({ enabled: parsed.data.enabled }, { headers: noStore });
}

export async function DELETE(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isSameOriginMutation(request)) {
    return Response.json({ error: "Cross-origin preference removal blocked." }, { status: 403 });
  }

  await prisma.providerFinderPreference.deleteMany({ where: { userId: user.id } });
  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: "finder.preferences.erased",
    entityType: "ProviderFinderPreference",
    entityId: user.id,
    participantId: user.id,
  });
  return Response.json({ enabled: false, erased: true }, { headers: noStore });
}
