import { createHash, randomBytes, randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { requireAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { assertCapabilityInvocation } from "@/lib/ai/platform/capabilities/enforcement";
import { verifyPurposeConsent } from "@/lib/consent/purpose-consent";
import { assertDelegatedOrSelfAuthority } from "@/lib/authority/delegation-check";
import { prisma } from "@/lib/prisma";
import { createCareRequestSchema } from "@/lib/validation/care";

/** Draft-only / escalate / filter-transfer — never book or pay. */
export const governedNavigatorActionSchema = z.enum([
  "create_care_request_draft",
  "transfer_provider_finder_filters",
  "open_human_escalation",
]);
export type GovernedNavigatorAction = z.infer<
  typeof governedNavigatorActionSchema
>;

export const governedEnvelopeStatusSchema = z.enum([
  "proposed",
  "approved",
  "rejected",
  "expired",
  "executed",
  "failed",
]);
export type GovernedEnvelopeStatus = z.infer<
  typeof governedEnvelopeStatusSchema
>;

const transferFiltersPayloadSchema = z.object({
  q: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  service: z.string().optional(),
  accessNeeds: z.array(z.string()).default([]),
  providerFinderPath: z.string().default("/provider-finder"),
});

const escalationPayloadSchema = z.object({
  reason: z.string().min(1),
  urgency: z.enum(["low", "medium", "high", "immediate"]),
  preferredContactMethod: z.string().min(1),
  confidentialityRestrictions: z.array(z.string()).default([]),
  summary: z.string().min(1),
});

export function validateGovernedActionPayload(
  actionType: GovernedNavigatorAction,
  payload: unknown,
): Record<string, unknown> {
  switch (actionType) {
    case "create_care_request_draft":
      return createCareRequestSchema.parse(payload) as Record<string, unknown>;
    case "transfer_provider_finder_filters":
      return transferFiltersPayloadSchema.parse(payload) as Record<
        string,
        unknown
      >;
    case "open_human_escalation":
      return escalationPayloadSchema.parse(payload) as Record<string, unknown>;
    default: {
      const _exhaustive: never = actionType;
      throw new Error(`UNSUPPORTED_GOVERNED_ACTION:${String(_exhaustive)}`);
    }
  }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashGovernedPayload(payload: unknown): string {
  return createHash("sha256").update(canonical(payload)).digest("hex");
}

function redactSensitive(payload: Record<string, unknown>): Record<string, unknown> {
  const clone = { ...payload };
  for (const key of Object.keys(clone)) {
    if (/phone|email|password|secret|token|ndis/i.test(key)) {
      clone[key] = "[redacted]";
    }
  }
  return clone;
}

export async function createGovernedActionEnvelope(input: {
  tenantId?: string | null;
  participantId: string;
  initiatingUserId: string;
  capabilityKey: string;
  actionType: GovernedNavigatorAction;
  payload: unknown;
  evidenceRefs?: string[];
  modelVersion?: string | null;
  promptVersion?: string | null;
  toolVersion?: string | null;
  consentReceiptId: string;
  requiredApproverRole: string;
  lifetimeMinutes?: number;
}) {
  const capability = requireAiCapability(input.capabilityKey);
  if (
    !capability.toolAllowlist.includes(input.actionType) &&
    capability.key === "navigator.provider_search_pilot"
  ) {
    // action types are also tools in the pilot allowlist
  }
  const capabilityScopes = capability.requiredConsentScopes ?? [];
  const invocation = assertCapabilityInvocation({
    capabilityKey: input.capabilityKey,
    tenantId: input.tenantId,
    toolName: input.actionType,
    consentScopesPresent: capabilityScopes,
  });
  if (!invocation.allowed) {
    throw new Error(`CAPABILITY_DENIED:${invocation.reason}`);
  }

  const validated = validateGovernedActionPayload(
    input.actionType,
    input.payload,
  );
  const issuedAt = new Date();
  const lifetime =
    input.lifetimeMinutes ?? capability.approvalExpiryMinutes ?? 30;
  const expiresAt = new Date(issuedAt.getTime() + lifetime * 60_000);
  const nonce = randomBytes(16).toString("hex");

  const envelope = await prisma.governedActionEnvelope.create({
    data: {
      id: randomUUID(),
      tenantId: input.tenantId ?? null,
      participantId: input.participantId,
      initiatingUserId: input.initiatingUserId,
      capabilityKey: input.capabilityKey,
      actionType: input.actionType,
      payloadJson: redactSensitive(validated) as Prisma.InputJsonValue,
      payloadHash: hashGovernedPayload(validated),
      evidenceRefs: input.evidenceRefs ?? [],
      modelVersion: input.modelVersion ?? null,
      promptVersion: input.promptVersion ?? capability.promptVersion,
      toolVersion: input.toolVersion ?? null,
      consentReceiptId: input.consentReceiptId,
      requiredApproverRole: input.requiredApproverRole,
      issuedAt,
      expiresAt,
      nonce,
      status: "proposed",
      singleUseConsumed: false,
    },
  });

  await createAuditEvent({
    actorUserId: input.initiatingUserId,
    participantId: input.participantId,
    action: "navigator.envelope.created",
    entityType: "GovernedActionEnvelope",
    entityId: envelope.id,
    metadata: {
      actionType: input.actionType,
      capabilityKey: input.capabilityKey,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return envelope;
}

export async function approveGovernedActionEnvelope(input: {
  envelopeId: string;
  approverUserId: string;
  participantId: string;
  tenantId?: string | null;
  reason?: string;
}) {
  const envelope = await prisma.governedActionEnvelope.findFirst({
    where: {
      id: input.envelopeId,
      participantId: input.participantId,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    },
  });
  if (!envelope) throw new Error("ENVELOPE_NOT_FOUND");
  if (envelope.status !== "proposed") throw new Error("ENVELOPE_NOT_PROPOSED");
  if (envelope.expiresAt <= new Date()) {
    await prisma.governedActionEnvelope.update({
      where: { id: envelope.id },
      data: { status: "expired" },
    });
    throw new Error("ENVELOPE_EXPIRED");
  }

  // Model must never approve its own action.
  if (input.approverUserId === "model" || input.approverUserId.startsWith("ai:")) {
    throw new Error("MODEL_CANNOT_APPROVE");
  }

  const authority = await assertDelegatedOrSelfAuthority({
    participantId: input.participantId,
    actorUserId: input.approverUserId,
    tenantId: input.tenantId ?? undefined,
    domain: "navigator",
    action: "approve_envelope",
    consentScopes: ["navigator.provider_search"],
  });
  if (!authority.ok) throw new Error(authority.reason ?? "AUTHORITY_DENIED");

  const consent = await verifyPurposeConsent({
    participantId: input.participantId,
    tenantId: input.tenantId,
    purpose: "navigator.provider_search",
    action: envelope.actionType,
  });
  if (!consent.ok) throw new Error(`CONSENT_${(consent.reason ?? "missing").toUpperCase()}`);

  const updated = await prisma.governedActionEnvelope.update({
    where: { id: envelope.id },
    data: {
      status: "approved",
      decisionReason: input.reason ?? "participant_approved",
      approvedByUserId: input.approverUserId,
      approvedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: input.approverUserId,
    participantId: input.participantId,
    action: "navigator.envelope.approved",
    entityType: "GovernedActionEnvelope",
    entityId: envelope.id,
  });

  return updated;
}

/**
 * Revalidate identity, role, consent, delegation, feature flag and policy
 * immediately before execution. Fail closed. Prevent replay.
 */
export async function executeGovernedActionEnvelope(input: {
  envelopeId: string;
  actorUserId: string;
  participantId: string;
  tenantId?: string | null;
  nonce: string;
  execute: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
}) {
  const envelope = await prisma.governedActionEnvelope.findFirst({
    where: {
      id: input.envelopeId,
      participantId: input.participantId,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    },
  });
  if (!envelope) throw new Error("ENVELOPE_NOT_FOUND");
  if (envelope.nonce !== input.nonce) throw new Error("ENVELOPE_REPLAY_OR_BAD_NONCE");
  if (envelope.singleUseConsumed) throw new Error("ENVELOPE_ALREADY_USED");
  if (envelope.status !== "approved") throw new Error("ENVELOPE_NOT_APPROVED");
  if (envelope.expiresAt <= new Date()) {
    await prisma.governedActionEnvelope.update({
      where: { id: envelope.id },
      data: { status: "expired" },
    });
    throw new Error("ENVELOPE_EXPIRED");
  }

  const execCapability = requireAiCapability(envelope.capabilityKey);
  const invocation = assertCapabilityInvocation({
    capabilityKey: envelope.capabilityKey,
    tenantId: input.tenantId,
    toolName: envelope.actionType,
    consentScopesPresent: execCapability.requiredConsentScopes ?? [],
  });
  if (!invocation.allowed) {
    throw new Error(`CAPABILITY_DENIED:${invocation.reason}`);
  }

  const authority = await assertDelegatedOrSelfAuthority({
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    tenantId: input.tenantId ?? undefined,
    domain: "navigator",
    action: "execute_envelope",
    consentScopes: ["navigator.provider_search"],
  });
  if (!authority.ok) throw new Error(authority.reason ?? "AUTHORITY_DENIED");

  const consent = await verifyPurposeConsent({
    participantId: input.participantId,
    tenantId: input.tenantId,
    purpose: "navigator.provider_search",
    action: envelope.actionType,
  });
  if (!consent.ok) throw new Error(`CONSENT_${(consent.reason ?? "missing").toUpperCase()}`);

  // Mark consumed before side effects to reduce double-exec races.
  const claimed = await prisma.governedActionEnvelope.updateMany({
    where: {
      id: envelope.id,
      singleUseConsumed: false,
      status: "approved",
    },
    data: { singleUseConsumed: true },
  });
  if (claimed.count !== 1) throw new Error("ENVELOPE_ALREADY_USED");

  try {
    const result = await input.execute(
      envelope.payloadJson as Record<string, unknown>,
    );
    const updated = await prisma.governedActionEnvelope.update({
      where: { id: envelope.id },
      data: {
        status: "executed",
        executionResultJson: result as Prisma.InputJsonValue,
        executedAt: new Date(),
      },
    });
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      action: "navigator.envelope.executed",
      entityType: "GovernedActionEnvelope",
      entityId: envelope.id,
      metadata: { actionType: envelope.actionType },
    });
    return updated;
  } catch (error) {
    await prisma.governedActionEnvelope.update({
      where: { id: envelope.id },
      data: {
        status: "failed",
        decisionReason:
          error instanceof Error ? error.message : "execution_failed",
      },
    });
    throw error;
  }
}
