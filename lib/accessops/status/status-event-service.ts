import { createHash } from "crypto";

import type {
  AccessEvidenceLevel,
  AccessOperationalState,
  AccessStatusEvent,
  AccessStatusReasonCode,
  AccessStatusSourceType,
  AccessVerificationStatus,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const statusEventSchema = z.object({
  assetId: z.string().min(1),
  safeDescription: z.string().min(1),
});

export interface AppendStatusEventInput {
  assetId: string;
  state: AccessOperationalState;
  sourceType: AccessStatusSourceType;
  safeDescription: string;
  observedAt: Date;
  effectiveFrom?: Date;
  previousState?: AccessOperationalState | null;
  sourceEntityId?: string | null;
  sourceReference?: string | null;
  evidenceLevel?: AccessEvidenceLevel;
  reasonCode?: AccessStatusReasonCode;
  expectedUntil?: Date | null;
  actualUntil?: Date | null;
  confidence?: number;
  freshnessWindowSeconds?: number;
  correlationId?: string;
  externalEventId?: string | null;
  verificationStatus?: AccessVerificationStatus;
}

export function deriveStatusCorrelationId(
  input: AppendStatusEventInput,
): string {
  return createHash("sha256")
    .update(
      `${input.assetId}:${input.sourceType}:${input.observedAt.toISOString()}:${input.state}`,
    )
    .digest("hex");
}

export async function appendStatusEvent(
  input: AppendStatusEventInput,
): Promise<AccessStatusEvent> {
  statusEventSchema.parse(input);
  return prisma.accessStatusEvent.create({
    data: {
      assetId: input.assetId,
      state: input.state,
      previousState: input.previousState ?? null,
      sourceType: input.sourceType,
      sourceEntityId: input.sourceEntityId ?? null,
      sourceReference: input.sourceReference ?? null,
      evidenceLevel: input.evidenceLevel ?? "unknown",
      reasonCode: input.reasonCode ?? "unknown",
      safeDescription: input.safeDescription,
      observedAt: input.observedAt,
      effectiveFrom: input.effectiveFrom ?? input.observedAt,
      expectedUntil: input.expectedUntil ?? null,
      actualUntil: input.actualUntil ?? null,
      confidence: input.confidence ?? 0.5,
      freshnessWindowSeconds: input.freshnessWindowSeconds ?? 86400,
      correlationId: input.correlationId ?? deriveStatusCorrelationId(input),
      externalEventId: input.externalEventId ?? null,
      verificationStatus: input.verificationStatus ?? "unverified",
    },
  });
}
