import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isRightsOsEnabled } from "@/lib/rights-os/config";
import { approveDataUseRequest } from "@/lib/rights-os/ledger/ledger-service";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

type RouteParams = { params: Promise<{ requestId: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  if (!isRightsOsEnabled()) {
    return jsonError("RightsOS is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { requestId } = await params;
  const body = (await req.json()) as { action?: string };

  const record = await prisma.rightsDataUseRequest.findFirst({
    where: {
      OR: [{ id: requestId }, { requestId }],
      subjectUserId: user.id,
    },
  });

  if (!record) return jsonError("Not found", 404);

  if (body.action === "approve") {
    const lease = await approveDataUseRequest({
      requestDbId: record.id,
      actorUserId: user.id,
    });
    return jsonOk({ lease, message: "Approved. A time-limited capability has been issued." });
  }

  if (body.action === "refuse") {
    await createAuditEvent({
      actorUserId: user.id,
      action: "rights.participant_refused",
      entityType: "RightsDataUseRequest",
      entityId: record.id,
      participantId: user.id,
    });
    await prisma.rightsDataUseRequest.update({
      where: { id: record.id },
      data: { status: "refused" },
    });
    return jsonOk({ message: "Refused. No information will be shared for this request." });
  }

  if (body.action === "revoke") {
    await prisma.rightsDataUseRequest.update({
      where: { id: record.id },
      data: { status: "revoked" },
    });
    await createAuditEvent({
      actorUserId: user.id,
      action: "rights.request_revoked",
      entityType: "RightsDataUseRequest",
      entityId: record.id,
      participantId: user.id,
    });
    return jsonOk({
      message:
        "Revoked. Future access through MapAble is stopped. Previously received copies outside MapAble may not be recalled.",
    });
  }

  return jsonError("Invalid action", 400);
}
