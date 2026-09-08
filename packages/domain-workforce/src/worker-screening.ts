import { z } from "zod";

export const workerScreeningJurisdictionSchema = z.enum([
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "ACT",
  "NT",
]);

export type WorkerScreeningJurisdiction = z.infer<typeof workerScreeningJurisdictionSchema>;

export const workerScreeningStatusSchema = z.enum([
  "clearance",
  "pending",
  "interim_bar",
  "exclusion",
  "suspension",
  "no_valid_clearance",
  "unable_to_verify",
]);

export type WorkerScreeningStatus = z.infer<typeof workerScreeningStatusSchema>;

export const workerScreeningEvidenceSourceSchema = z.enum([
  "authorised_ndis_worker_screening_database",
  "state_or_territory_worker_screening_unit",
  "provider_supplied_evidence",
  "public_regulatory_source",
]);

export const workerScreeningQuerySchema = z.object({
  workerName: z.string().trim().min(1).optional(),
  screeningId: z.string().trim().min(1).optional(),
  dateOfBirth: z.string().date().optional(),
  jurisdiction: workerScreeningJurisdictionSchema.optional(),
  employerProviderName: z.string().trim().min(1).optional(),
  employerAbn: z.string().trim().regex(/^\d{11}$/).optional(),
}).refine(
  (value) => Boolean(value.workerName || value.screeningId || value.employerProviderName || value.employerAbn),
  { message: "Provide at least one worker or employer identifier." },
);

export type WorkerScreeningQuery = z.infer<typeof workerScreeningQuerySchema>;

export const workerScreeningEvidenceSchema = z.object({
  jurisdiction: workerScreeningJurisdictionSchema.optional(),
  status: workerScreeningStatusSchema,
  source: workerScreeningEvidenceSourceSchema,
  checkedAt: z.string().datetime(),
  validFrom: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  sourceReference: z.string().trim().min(1).optional(),
  notes: z.array(z.string()).default([]),
});

export type WorkerScreeningEvidence = z.infer<typeof workerScreeningEvidenceSchema>;

export const workerScreeningAssessmentSchema = z.object({
  status: workerScreeningStatusSchema,
  canTreatAsCleared: z.boolean(),
  requiresHumanReview: z.boolean(),
  reasonCodes: z.array(z.string()),
  evidence: z.array(workerScreeningEvidenceSchema),
});

export type WorkerScreeningAssessment = z.infer<typeof workerScreeningAssessmentSchema>;

const BLOCKING_STATUSES = new Set<WorkerScreeningStatus>([
  "pending",
  "interim_bar",
  "exclusion",
  "suspension",
  "no_valid_clearance",
  "unable_to_verify",
]);

/**
 * Fail closed: only current authorised evidence of `clearance` can satisfy a
 * worker-screening gate. Provider registration, public enforcement search, or
 * absence of adverse information must never be substituted for worker clearance.
 */
export function assessWorkerScreening(params: {
  evidence: WorkerScreeningEvidence[];
  now?: Date;
}): WorkerScreeningAssessment {
  const now = params.now ?? new Date();
  const evidence = params.evidence.map((item) => workerScreeningEvidenceSchema.parse(item));

  if (evidence.length === 0) {
    return {
      status: "unable_to_verify",
      canTreatAsCleared: false,
      requiresHumanReview: true,
      reasonCodes: ["WORKER_SCREENING_EVIDENCE_MISSING"],
      evidence,
    };
  }

  const blocking = evidence.find((item) => BLOCKING_STATUSES.has(item.status));
  if (blocking) {
    return {
      status: blocking.status,
      canTreatAsCleared: false,
      requiresHumanReview: true,
      reasonCodes: [`WORKER_SCREENING_${blocking.status.toUpperCase()}`],
      evidence,
    };
  }

  const clearance = evidence.find((item) => item.status === "clearance");
  if (!clearance) {
    return {
      status: "unable_to_verify",
      canTreatAsCleared: false,
      requiresHumanReview: true,
      reasonCodes: ["WORKER_SCREENING_CLEARANCE_NOT_ESTABLISHED"],
      evidence,
    };
  }

  if (clearance.expiresAt && new Date(clearance.expiresAt) <= now) {
    return {
      status: "no_valid_clearance",
      canTreatAsCleared: false,
      requiresHumanReview: true,
      reasonCodes: ["WORKER_SCREENING_CLEARANCE_EXPIRED"],
      evidence,
    };
  }

  const authorised = clearance.source === "authorised_ndis_worker_screening_database"
    || clearance.source === "state_or_territory_worker_screening_unit";

  if (!authorised) {
    return {
      status: "unable_to_verify",
      canTreatAsCleared: false,
      requiresHumanReview: true,
      reasonCodes: ["WORKER_SCREENING_AUTHORITATIVE_SOURCE_REQUIRED"],
      evidence,
    };
  }

  return {
    status: "clearance",
    canTreatAsCleared: true,
    requiresHumanReview: false,
    reasonCodes: [],
    evidence,
  };
}
