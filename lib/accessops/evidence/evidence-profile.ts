import type { EvidenceReference } from "../types";

import { checksumEvidence } from "./checksum";

export function buildEvidenceReference(
  ref: string,
  capturedAt: Date,
  isPrivate = true,
): EvidenceReference {
  return {
    ref,
    checksum: checksumEvidence(ref),
    capturedAt,
    private: isPrivate,
  };
}
