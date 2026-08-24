import { z } from "zod";

import { DATA_CLASSES } from "@/lib/ai/platform/types/classification";

import { MAPABLE_CONNECTOR_KEYS } from "./types";

export const mapAbleConnectorKeySchema = z.enum(MAPABLE_CONNECTOR_KEYS);

export const connectorActorSchema = z.object({
  actorId: z.string().min(1),
  actorType: z.enum([
    "participant",
    "authorised_human",
    "system_service",
    "agent",
  ]),
  role: z.enum(["agent", "kernel", "gateway", "human", "service"]),
});

export const connectorTenantSchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().nullable(),
  organisationId: z.string().nullable(),
});

export const approvedActionEnvelopeSchema = z.object({
  proposalId: z.string().uuid(),
  approvalId: z.string().uuid(),
  nonce: z.string().min(8),
  payloadHash: z.string().min(16),
  actionKey: z.string().min(1),
  participantId: z.string().min(1),
  approvedPayload: z.record(z.string(), z.unknown()),
});

export const connectorReadRequestSchema = z.object({
  connectorKey: mapAbleConnectorKeySchema,
  operation: z.string().min(1),
  purpose: z.string().min(1).max(500),
  actor: connectorActorSchema,
  tenant: connectorTenantSchema,
  consentScopes: z.array(z.string()),
  scope: z.record(z.string(), z.unknown()),
  provenanceClass: z.string().optional(),
});

export const connectorWriteRequestSchema = z.object({
  connectorKey: mapAbleConnectorKeySchema,
  operation: z.string().min(1),
  actor: connectorActorSchema,
  tenant: connectorTenantSchema,
  consentScopes: z.array(z.string()),
  approvedEnvelope: approvedActionEnvelopeSchema,
  idempotencyKey: z.string().min(8).optional(),
});

export const connectorCanonicalRecordSchema = z.object({
  recordId: z.string().min(1),
  connectorKey: mapAbleConnectorKeySchema,
  tenantId: z.string().min(1),
  dataClass: z.enum(DATA_CLASSES),
  contentKind: z.literal("data"),
  payload: z.record(z.string(), z.unknown()),
  provenance: z.object({
    sourceSystem: z.string(),
    sourceTrustClass: z.enum([
      "system_record",
      "provider_report",
      "external_read",
      "stub",
    ]),
    retrievedAt: z.string(),
    purpose: z.string(),
    actorId: z.string(),
    injectionQuarantined: z.boolean(),
  }),
});
