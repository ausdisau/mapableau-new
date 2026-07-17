import { createHash } from "node:crypto";

import type { PortabilityExportJob } from "@prisma/client";

/**
 * Portability receipts are hashes over the exported bundle, so that a
 * participant can prove to an auditor "on this date I exported this
 * bundle". No secret material is required.
 */
export function receiptForExportJob(job: PortabilityExportJob): string {
  return createHash("sha256")
    .update(
      [
        job.id,
        job.participantId,
        job.scope,
        job.completedAt?.toISOString?.() ?? "",
        job.artifactRef ?? "",
      ].join("|")
    )
    .digest("hex");
}
