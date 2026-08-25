import { z } from "zod";

import {
  CONTEXT_DOMAINS,
  CONTEXT_TYPES,
  DATA_CLASS_VALUES,
  DOMAIN_EVENT_TYPES,
  EVENT_PRODUCERS,
  FRESHNESS_STATUSES,
  SOURCE_TRUST_CLASSES,
  VERIFICATION_STATUSES,
} from "./types";

const subjectRefSchema = z.object({
  kind: z.enum([
    "participant",
    "mission",
    "provider",
    "worker",
    "venue",
    "job",
    "organisation",
  ]),
  id: z.string().min(1),
});

export const mapAbleContextRecordSchema = z.object({
  contextId: z.string().min(1),
  contextType: z.enum(CONTEXT_TYPES),
  subjectRefs: z.array(subjectRefSchema).min(1),
  domain: z.enum(CONTEXT_DOMAINS),
  tenantId: z.string().min(1),
  sourceType: z.enum(SOURCE_TRUST_CLASSES),
  sourceRef: z.string().min(1),
  sourceAuthority: z.string().min(1),
  observedAt: z.string().min(1),
  effectiveFrom: z.string().optional(),
  effectiveUntil: z.string().optional(),
  receivedAt: z.string().min(1),
  freshnessStatus: z.enum(FRESHNESS_STATUSES),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  evidenceRefs: z.array(z.string()),
  dataClasses: z.array(z.enum(DATA_CLASS_VALUES)).min(1),
  consentScopes: z.array(z.string()),
  payload: z.record(z.string(), z.unknown()),
  traceId: z.string().min(1),
  consentRevokedAt: z.string().nullable().optional(),
  missionIds: z.array(z.string()).optional(),
});

export const mapAbleDomainEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(DOMAIN_EVENT_TYPES),
  domain: z.enum(CONTEXT_DOMAINS),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  tenantId: z.string().min(1),
  occurredAt: z.string().min(1),
  receivedAt: z.string().min(1),
  producer: z.enum(EVENT_PRODUCERS),
  schemaVersion: z.number().int().positive(),
  evidenceRefs: z.array(z.string()),
  dataClasses: z.array(z.enum(DATA_CLASS_VALUES)).min(1),
  consentScopes: z.array(z.string()),
  subjectRefs: z.array(subjectRefSchema),
  missionIds: z.array(z.string()),
  payload: z.record(z.string(), z.unknown()),
  traceId: z.string().min(1),
  idempotencyKey: z.string().nullable(),
  sourceTrust: z.enum(SOURCE_TRUST_CLASSES),
  sourceRef: z.string().min(1),
});

export const ingestDomainEventInputSchema = z.object({
  eventType: z.enum(DOMAIN_EVENT_TYPES),
  domain: z.enum(CONTEXT_DOMAINS),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  tenantId: z.string().min(1),
  occurredAt: z.string().optional(),
  producer: z.enum(EVENT_PRODUCERS),
  schemaVersion: z.number().int().positive().default(1),
  evidenceRefs: z.array(z.string()).default([]),
  dataClasses: z.array(z.enum(DATA_CLASS_VALUES)).min(1),
  consentScopes: z.array(z.string()).default([]),
  subjectRefs: z.array(subjectRefSchema).default([]),
  missionIds: z.array(z.string()).default([]),
  payload: z.record(z.string(), z.unknown()).default({}),
  traceId: z.string().min(1),
  idempotencyKey: z.string().nullable().optional(),
  sourceTrust: z.enum(SOURCE_TRUST_CLASSES),
  sourceRef: z.string().min(1),
  sourceAuthority: z.string().min(1),
  authenticated: z.boolean().default(false),
  adapterProvenance: z.string().nullable().optional(),
  contextType: z.enum(CONTEXT_TYPES).optional(),
});

export const missionContextQuerySchema = z.object({
  missionId: z.string().min(1),
  participantId: z.string().min(1),
  tenantId: z.string().min(1),
  requestedContextTypes: z.array(z.enum(CONTEXT_TYPES)).optional(),
  consentScopes: z.array(z.string()),
  actor: z.object({
    actorId: z.string().min(1),
    role: z.enum(["participant", "support_coordinator", "admin", "system"]),
    tenantId: z.string().min(1),
  }),
});

export type IngestDomainEventInput = z.infer<typeof ingestDomainEventInputSchema>;
