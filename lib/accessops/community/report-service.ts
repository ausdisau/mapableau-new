import type {
  AccessCommunityReport,
  AccessCommunityReportKind,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJsonArray } from "@/lib/prisma-json";

export async function submitCommunityReport(input: {
  assetId: string;
  kind: AccessCommunityReportKind;
  safeNarrative: string;
  reporterOpaqueRef?: string | null;
  evidenceRefs?: string[];
}): Promise<AccessCommunityReport> {
  return prisma.accessCommunityReport.create({
    data: {
      assetId: input.assetId,
      kind: input.kind,
      safeNarrative: input.safeNarrative,
      reporterOpaqueRef: input.reporterOpaqueRef ?? null,
      evidenceRefs: input.evidenceRefs
        ? asJsonArray(input.evidenceRefs)
        : undefined,
      status: "submitted",
    },
  });
}

export function communityReportIsAllegation(): true {
  return true;
}
