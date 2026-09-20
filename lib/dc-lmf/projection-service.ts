import {
  dclmfProjectionRequestSchema,
  dclmfSchemaVersion,
  type DclmfMemoryCategory,
  type DclmfProjection,
  type DclmfProjectionRequest,
  type DclmfProjectedMemory,
} from "@mapable/contracts";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { checkConsent } from "@/lib/consent/consent-service";
import { consentScopeToPrisma } from "@/lib/consent/scope-map";
import { isDcLmfEnabled } from "@/lib/config/dc-lmf";
import { prisma } from "@/lib/prisma";
import {
  assertTrustFabricEnabled,
  recordPurposeBoundAccessReceipt,
} from "@/lib/trust/fabric/receipt-service";
import type { AccessFieldCategory } from "@/lib/trust/fabric/types";
import type { ConsentScope } from "@/types/mapable";

import { isWithinDataClass } from "./policy";

const CATEGORY_TO_RECEIPT: Record<DclmfMemoryCategory, AccessFieldCategory> = {
  identity: "identity_contact",
  access: "access_requirements",
  baseline: "other_support_profile",
  episodic: "service_history_summary",
  preference: "other_support_profile",
  procedural: "other_support_profile",
  relational: "other_support_profile",
  correction: "other_support_profile",
  evidence: "access_requirements",
};

function toProjectedMemory(row: {
  id: string;
  category: string;
  payloadJson: unknown;
  payloadRef: string | null;
  sourceType: string;
  sourceRef: string | null;
  confidence: string;
  scope: string;
  dataClass: string;
  evidenceRefs: string[];
  observedAt: Date | null;
  validFrom: Date | null;
  validUntil: Date | null;
  supersedesId: string | null;
  status: string;
}): DclmfProjectedMemory {
  return {
    id: row.id,
    category: row.category as DclmfProjectedMemory["category"],
    payload: row.payloadJson,
    payloadRef: row.payloadRef,
    sourceType: row.sourceType as DclmfProjectedMemory["sourceType"],
    sourceRef: row.sourceRef,
    confidence: row.confidence as DclmfProjectedMemory["confidence"],
    scope: row.scope as DclmfProjectedMemory["scope"],
    dataClass: row.dataClass as DclmfProjectedMemory["dataClass"],
    evidenceRefs: row.evidenceRefs,
    observedAt: row.observedAt?.toISOString() ?? null,
    validFrom: row.validFrom?.toISOString() ?? null,
    validUntil: row.validUntil?.toISOString() ?? null,
    supersedesId: row.supersedesId,
    status: row.status as DclmfProjectedMemory["status"],
  };
}

async function resolveConsent(input: DclmfProjectionRequest): Promise<string | null> {
  if (input.actorUserId === input.participantId) return null;
  if (!input.consentScope) {
    throw new Error("DC_LMF_CONSENT_SCOPE_REQUIRED");
  }

  const scope = input.consentScope as ConsentScope;
  const allowed = await checkConsent({
    subjectUserId: input.participantId,
    scope,
    grantedToUserId: input.organisationId ? undefined : input.actorUserId,
    grantedToOrganisationId: input.organisationId ?? undefined,
  });
  if (!allowed) throw new Error("DC_LMF_CONSENT_REQUIRED");

  const record = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: input.participantId,
      scope: consentScopeToPrisma(scope),
      status: "active",
      ...(input.organisationId
        ? { grantedToOrganisationId: input.organisationId }
        : { grantedToUserId: input.actorUserId }),
      OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
    },
    select: { id: true },
  });
  return record?.id ?? null;
}

export async function projectContext(
  input: DclmfProjectionRequest,
): Promise<DclmfProjection> {
  if (!isDcLmfEnabled()) throw new Error("DC_LMF_NOT_ENABLED");
  assertTrustFabricEnabled();

  const parsed = dclmfProjectionRequestSchema.parse(input);
  const consentRecordId = await resolveConsent(parsed);
  const now = new Date();

  const rows = await prisma.dclmfMemoryRecord.findMany({
    where: {
      participantId: parsed.participantId,
      category: { in: parsed.categories },
      status: parsed.includeContested ? { in: ["active", "contested"] } : "active",
      OR: [{ validUntil: null }, { validUntil: { gt: now } }],
    },
    orderBy: [{ observedAt: "desc" }, { createdAt: "desc" }],
  });

  const records = rows
    .filter((row) => {
      const purposeAllowed =
        row.purposeTags.length === 0 ||
        row.purposeTags.includes("*") ||
        row.purposeTags.includes(parsed.purpose);
      return (
        purposeAllowed &&
        isWithinDataClass(
          row.dataClass as DclmfProjectedMemory["dataClass"],
          parsed.maxDataClass,
        )
      );
    })
    .map(toProjectedMemory);

  const receiptCategories = Array.from(
    new Set(records.map((record) => CATEGORY_TO_RECEIPT[record.category])),
  );

  if (receiptCategories.length > 0) {
    await recordPurposeBoundAccessReceipt({
      actorUserId: parsed.actorUserId,
      participantId: parsed.participantId,
      organisationId: parsed.organisationId ?? null,
      purpose: parsed.purpose,
      fieldCategories: receiptCategories,
      authoritySource:
        parsed.actorUserId === parsed.participantId
          ? "participant_self"
          : "consent",
      consentRecordId,
      outcome: "disclosed",
    });
  }

  await createAuditEvent({
    actorUserId: parsed.actorUserId,
    action: "dc_lmf.projection.created",
    entityType: "DclmfContextProjection",
    participantId: parsed.participantId,
    organisationId: parsed.organisationId ?? null,
    metadata: {
      purpose: parsed.purpose,
      service: parsed.service,
      categories: parsed.categories,
      memoryRecordIds: records.map((record) => record.id),
      memoryCount: records.length,
      consentRecordId,
      maxDataClass: parsed.maxDataClass,
    },
  });

  return {
    schemaVersion: dclmfSchemaVersion,
    participantId: parsed.participantId,
    purpose: parsed.purpose,
    service: parsed.service,
    generatedAt: new Date().toISOString(),
    authoritySource:
      parsed.actorUserId === parsed.participantId
        ? "participant_self"
        : "consent",
    consentRecordId,
    records,
    unresolved: [],
    limitations: [
      "Memory is contextual evidence only and cannot create consent, capacity, clinical indication, funding eligibility, legal authority, or treatment limits.",
      "Raw health-related, emergency-only, and local-only values are not persisted inline in DC-LMF v1.",
    ],
  };
}
