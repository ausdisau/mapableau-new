/**
 * Zod schemas for release governance (Prompt 12).
 * Validation only — never invents approval or evidence fields.
 */

import { z } from "zod";

import { AUTHORITY_CEILINGS } from "@/lib/ai/platform/types/authority";
import { DATA_CLASSES } from "@/lib/ai/platform/types/classification";
import { CAPABILITY_MATURITY } from "@/lib/ai/platform/types/maturity";

import {
  ACCESSIBILITY_EVIDENCE_DIMENSIONS,
  OPERATIONS_CAPACITY_DIMENSIONS,
  READINESS_VERDICTS,
  RELEASE_STATES,
  SECURITY_EVIDENCE_DIMENSIONS,
} from "./types";

export const releaseStateSchema = z.enum(RELEASE_STATES);
export const readinessVerdictSchema = z.enum(READINESS_VERDICTS);

export const evidencePresenceSchema = z.object({
  present: z.boolean(),
  ref: z.string().min(1).nullable(),
  recordedAt: z.string().datetime().nullable(),
  notes: z.string().optional(),
});

function dimBundle<T extends readonly [string, ...string[]]>(
  dims: T,
  entry: z.ZodTypeAny
) {
  return z.object(
    Object.fromEntries(dims.map((d) => [d, entry])) as Record<
      T[number],
      z.ZodTypeAny
    >
  );
}

const operationsCapacityEntrySchema = evidencePresenceSchema.extend({
  namedOwner: z.string().min(1).nullable(),
});

export const releaseGateEvidenceSchema = z.object({
  owner: evidencePresenceSchema.extend({
    namedOwner: z.string().min(1).nullable(),
  }),
  purpose: evidencePresenceSchema,
  authorityCeiling: evidencePresenceSchema.extend({
    ceiling: z.enum(AUTHORITY_CEILINGS).nullable(),
  }),
  privacyClassification: evidencePresenceSchema.extend({
    dataClasses: z.array(z.enum(DATA_CLASSES)),
  }),
  consentScopes: evidencePresenceSchema.extend({
    scopes: z.array(z.string()),
  }),
  humanReviewPath: evidencePresenceSchema,
  featureFlag: evidencePresenceSchema.extend({
    flagName: z.string().nullable(),
  }),
  killSwitch: evidencePresenceSchema.extend({
    killSwitchKey: z.string().nullable(),
  }),
  evaluationSuite: evidencePresenceSchema.extend({
    suiteId: z.string().nullable(),
  }),
  accessibility: dimBundle(
    ACCESSIBILITY_EVIDENCE_DIMENSIONS,
    evidencePresenceSchema
  ),
  security: dimBundle(SECURITY_EVIDENCE_DIMENSIONS, evidencePresenceSchema),
  rollbackPlan: evidencePresenceSchema,
  operationalOwner: evidencePresenceSchema.extend({
    namedOwner: z.string().min(1).nullable(),
  }),
  supportProcess: evidencePresenceSchema,
  incidentProcess: evidencePresenceSchema,
  knownLimitations: evidencePresenceSchema.extend({
    limitations: z.array(z.string()),
  }),
  operationsCapacity: dimBundle(
    OPERATIONS_CAPACITY_DIMENSIONS,
    operationsCapacityEntrySchema
  ),
});

export const mapAbleReleaseManifestSchema = z.object({
  capabilityKey: z.string().min(1),
  releaseState: releaseStateSchema,
  version: z.string().min(1),
  allowedCohorts: z.array(z.string()),
  domains: z.array(z.string()),
  requiredFlags: z.array(z.string()),
  requiredEvals: z.array(z.string()),
  requiredHumanOperations: z.array(z.string()),
  knownLimitations: z.array(z.string()),
  privacyReviewRef: z.string().nullable(),
  accessibilityReviewRef: z.string().nullable(),
  securityReviewRef: z.string().nullable(),
  rollbackPlanRef: z.string().nullable(),
  owner: z.string().min(1),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  evidence: releaseGateEvidenceSchema,
  relatedCapabilityMaturity: z.enum(CAPABILITY_MATURITY),
});

export const pilotCohortMembershipSchema = z.object({
  cohortId: z.string().min(1),
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  capabilityKey: z.string().min(1),
  grantedAt: z.string().datetime(),
  grantedBy: z.string().min(1),
  revokedAt: z.string().datetime().nullable(),
  revokedBy: z.string().nullable(),
  auditNote: z.string(),
});
