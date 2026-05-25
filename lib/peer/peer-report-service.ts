import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { createPeerReportSchema } from "@/lib/validation/peer";
import type { z } from "zod";

import { enqueueModeration } from "./peer-moderation-service";

export async function createPeerReport(
  reporterProfileId: string,
  userId: string,
  data: z.infer<typeof createPeerReportSchema>
) {
  const report = await prisma.peerReport.create({
    data: {
      reporterId: reporterProfileId,
      contentType: data.contentType,
      contentId: data.contentId,
      reason: data.reason,
      details: data.details,
    },
  });

  const priority =
    data.reason === "self_harm_or_crisis" ? "urgent" : "high";

  await enqueueModeration({
    reportId: report.id,
    contentType: data.contentType,
    contentId: data.contentId,
    priority,
    autoFlags: { flags: [data.reason] },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.report.created",
    entityType: "PeerReport",
    entityId: report.id,
    metadata: { reason: data.reason },
  });

  return report;
}
