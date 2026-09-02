import {
  buildAssertionProvenance,
  evidenceClassToEvidenceProvenance,
  type AccessGraphAssertionProvenance,
} from "@mapable/contracts";

import type { AccessEvidenceClass } from "./classes";
import type { TemporalAccessState } from "../temporal/vocabulary";

export function projectEvidenceClassToProvenance(input: {
  evidenceClass: AccessEvidenceClass;
  temporalState: TemporalAccessState;
  observedAt: string;
  source?: string;
  confidence?: number | null;
  expiryAt?: string | null;
}): AccessGraphAssertionProvenance {
  const provenance = evidenceClassToEvidenceProvenance(
    input.evidenceClass,
    input.temporalState,
  );

  return buildAssertionProvenance({
    provenance,
    source: input.source ?? input.evidenceClass,
    timestamp: input.observedAt,
    evidenceType: input.evidenceClass,
    confidence: input.confidence ?? null,
    expiryAt: input.expiryAt ?? null,
  });
}
