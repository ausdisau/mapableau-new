import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  workerUserId: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const pref = await prisma.participantWorkerPreference.upsert({
    where: {
      participantId_workerUserId_preferenceType: {
        participantId: user.id,
        workerUserId: body.workerUserId,
        preferenceType: "blocked",
      },
    },
    create: {
      participantId: user.id,
      workerUserId: body.workerUserId,
      preferenceType: "blocked",
      notes: body.notes,
    },
    update: { notes: body.notes },
  });
  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "profile.updated",
    entityType: "participant_worker_block",
    entityId: pref.id,
    participantId: user.id,
  });
  return jsonOk({ preference: pref });
}
