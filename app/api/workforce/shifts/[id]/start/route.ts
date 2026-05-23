import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const shift = await prisma.careShift.findFirst({
    where: { id, workerProfile: { userId: user.id } },
  });
  if (!shift) return jsonError("Not found", 404);

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "booking.updated",
    entityType: "care_shift",
    entityId: id,
    metadata: { action: "start" },
  });

  return jsonOk({ ok: true, status: "in_progress" });
}
