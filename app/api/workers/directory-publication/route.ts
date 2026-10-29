import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { isSameOriginMutation } from "@/lib/provider/finder/personalisation/origin";

const bodySchema = z.object({
  workerProfileId: z.string().min(1).max(120),
  published: z.boolean(),
}).strict();

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const profiles = await prisma.workerProfile.findMany({
    where: { userId: user.id },
    select: {
      id: true, displayName: true, active: true,
      directoryPublication: { select: { published: true, consentedAt: true } },
    },
  });
  return Response.json({ profiles }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isSameOriginMutation(request)) return Response.json({ error: "Forbidden origin" }, { status: 403 });

  const raw: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Invalid publication request" }, { status: 400 });

  // No organisation-wide publication: only the worker may disclose their own profile.
  const profile = await prisma.workerProfile.findFirst({
    where: { id: parsed.data.workerProfileId, userId: user.id },
    select: { id: true, active: true },
  });
  if (!profile) return Response.json({ error: "Worker profile not found" }, { status: 404 });
  if (parsed.data.published && !profile.active) {
    return Response.json({ error: "Inactive profiles cannot be published" }, { status: 409 });
  }

  const consentedAt = parsed.data.published ? new Date() : null;
  const publication = await prisma.workerDirectoryPublication.upsert({
    where: { workerProfileId: profile.id },
    create: { workerProfileId: profile.id, published: parsed.data.published, consentedAt },
    update: { published: parsed.data.published, consentedAt },
    select: { published: true, consentedAt: true },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: publication.published ? "worker.directory.published" : "worker.directory.withdrawn",
    entityType: "WorkerProfile",
    entityId: profile.id,
  });

  return Response.json({ publication }, { headers: { "Cache-Control": "no-store" } });
}
