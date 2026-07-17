import type { WorkerBanningAssessmentStatus } from "@prisma/client";

import { sourceUnavailableMeansClear } from "@/lib/ndis-platform-trust/banning-orders/banning-policy";
import { prisma } from "@/lib/prisma";

export async function recordBanningOrderAssessment(params: {
  organisationId: string;
  workerUserId: string;
  status: WorkerBanningAssessmentStatus;
  sourceLabel: string;
  checkedById?: string | null;
  notes?: string | null;
}) {
  if (
    params.status === "clear" &&
    (params.sourceLabel === "unconfigured" ||
      params.sourceLabel === "source_unavailable")
  ) {
    throw new Error("BANNING_CLEAR_REQUIRES_CONFIGURED_SOURCE");
  }

  // Document fail-closed invariant for callers/tests.
  void sourceUnavailableMeansClear(params.status);

  return prisma.workerBanningOrderAssessment.create({
    data: {
      organisationId: params.organisationId,
      workerUserId: params.workerUserId,
      status: params.status,
      sourceLabel: params.sourceLabel,
      checkedById: params.checkedById ?? null,
      notes: params.notes ?? null,
      checkedAt: new Date(),
    },
  });
}
