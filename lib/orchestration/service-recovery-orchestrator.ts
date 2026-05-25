import type { ServiceRecoveryTrigger } from "@prisma/client";

import { isModuleEnabled } from "@/lib/feature-flags/server-feature-flag";
import { openRecoveryCase } from "@/lib/service-recovery/recovery-case-service";

export async function openRecoveryCaseFromBookingEvent(params: {
  participantId: string;
  bookingId: string;
  organisationId?: string;
  trigger: ServiceRecoveryTrigger;
  summary: string;
  createdById?: string;
}) {
  const enabled = await isModuleEnabled("service_recovery_enabled");
  if (!enabled) return { skipped: true };

  const caseRecord = await openRecoveryCase({
    participantId: params.participantId,
    bookingId: params.bookingId,
    organisationId: params.organisationId,
    trigger: params.trigger,
    summary: params.summary,
    createdById: params.createdById,
  });

  return { caseId: caseRecord.id };
}
