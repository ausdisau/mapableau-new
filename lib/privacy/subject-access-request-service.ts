import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function prepareSubjectAccessExport(requestId: string, actorId: string) {
  if (!remainingSystemsConfig.privacyGovernanceEnabled) {
    throw new Error("PRIVACY_GOVERNANCE_DISABLED");
  }

  const request = await prisma.personalDataVaultRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("NOT_FOUND");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const exportRecord = await prisma.subjectAccessExport.create({
    data: {
      requestId,
      status: "ready",
      expiresAt,
      downloadKey: `sar-${requestId}-${Date.now()}`,
    },
  });

  await prisma.privacyRequestEvent.create({
    data: {
      requestId,
      action: "export_prepared",
      actorId,
    },
  });

  await createAuditEvent({
    actorUserId: actorId,
    action: "privacy.sar_export_prepared",
    entityType: "SubjectAccessExport",
    entityId: exportRecord.id,
  });

  return {
    export: exportRecord,
    message:
      "Export placeholder ready. Human review required before download. No third-party private data included automatically.",
    placeholderPayload: {
      profile: "redacted-summary",
      bookings: "summary-count-only",
      consents: "scope-list-only",
    },
  };
}
