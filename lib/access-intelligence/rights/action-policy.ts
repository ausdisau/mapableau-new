import { z } from "zod";

import { recordAuditEvent } from "../audit";

export const sensitiveActionSchema = z.enum([
  "requestVenueVerification",
  "submitBarrierReport",
  "shareAccessPassport",
  "shareVisitPlan",
]);

export const consentGrantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  purpose: z.enum([
    "venue_verification",
    "visit_plan_sharing",
    "support_worker_sharing",
    "research",
  ]),
  fieldKeys: z.array(z.string()),
  recipientType: z.string(),
  recipientId: z.string().optional(),
  grantedAt: z.string(),
  expiresAt: z.string().optional(),
  revokedAt: z.string().optional(),
});

export const actionPolicyDecisionSchema = z.object({
  allowed: z.boolean(),
  approvalRequired: z.boolean(),
  reasons: z.array(z.string()),
  fieldsPermitted: z.array(z.string()),
  fieldsDenied: z.array(z.string()),
});

export type SensitiveAction = z.infer<typeof sensitiveActionSchema>;
export type ConsentGrant = z.infer<typeof consentGrantSchema>;
export type ActionPolicyDecision = z.infer<typeof actionPolicyDecisionSchema>;

const grants = new Map<string, ConsentGrant>();

export function storeConsentGrant(grant: ConsentGrant): ConsentGrant {
  grants.set(grant.id, grant);
  return grant;
}

export function revokeConsentGrant(grantId: string): ConsentGrant | null {
  const g = grants.get(grantId);
  if (!g) return null;
  const next = { ...g, revokedAt: new Date().toISOString() };
  grants.set(grantId, next);
  return next;
}

export function getConsentGrant(grantId: string): ConsentGrant | undefined {
  return grants.get(grantId);
}

export function evaluateActionPolicy(input: {
  action: SensitiveAction;
  userId: string;
  requestedFields: string[];
  shareableFields: string[];
  approved: boolean;
  consentGrantId?: string;
}): ActionPolicyDecision {
  const fieldsPermitted = input.requestedFields.filter((f) =>
    input.shareableFields.includes(f),
  );
  const fieldsDenied = input.requestedFields.filter(
    (f) => !input.shareableFields.includes(f),
  );
  const reasons: string[] = [];

  if (input.consentGrantId) {
    const grant = grants.get(input.consentGrantId);
    if (!grant) {
      return {
        allowed: false,
        approvalRequired: true,
        reasons: ["Consent grant not found."],
        fieldsPermitted: [],
        fieldsDenied: input.requestedFields,
      };
    }
    if (grant.revokedAt) {
      return {
        allowed: false,
        approvalRequired: false,
        reasons: ["Consent grant was revoked."],
        fieldsPermitted: [],
        fieldsDenied: input.requestedFields,
      };
    }
    if (grant.expiresAt && grant.expiresAt < new Date().toISOString()) {
      return {
        allowed: false,
        approvalRequired: true,
        reasons: ["Consent grant expired."],
        fieldsPermitted: [],
        fieldsDenied: input.requestedFields,
      };
    }
  }

  reasons.push("Sensitive write requires explicit in-product approval.");
  if (fieldsDenied.length) {
    reasons.push(`Denied fields not marked shareable: ${fieldsDenied.join(", ")}`);
  }

  const approvalRequired = true;
  const allowed = input.approved && fieldsDenied.length === 0;

  if (!input.approved) {
    reasons.push("User has not approved this action yet.");
  }

  return {
    allowed,
    approvalRequired,
    reasons,
    fieldsPermitted,
    fieldsDenied,
  };
}

export function executeApprovedSensitiveAction(input: {
  action: SensitiveAction;
  userId: string;
  recipient: string;
  purpose: string;
  payloadFields: string[];
  shareableFields: string[];
  approved: boolean;
  consentGrantId?: string;
}): { policy: ActionPolicyDecision; auditId: string | null } {
  const policy = evaluateActionPolicy({
    action: input.action,
    userId: input.userId,
    requestedFields: input.payloadFields,
    shareableFields: input.shareableFields,
    approved: input.approved,
    consentGrantId: input.consentGrantId,
  });

  if (!policy.allowed) {
    return { policy, auditId: null };
  }

  const payloadHash = Buffer.from(
    JSON.stringify({
      action: input.action,
      fields: [...policy.fieldsPermitted].sort(),
      recipient: input.recipient,
      purpose: input.purpose,
    }),
  )
    .toString("base64")
    .slice(0, 32);

  const event = recordAuditEvent({
    actorUserId: input.userId,
    action: input.action,
    purpose: input.purpose,
    recipient: input.recipient,
    fieldsShared: policy.fieldsPermitted,
    outcome: "approved",
    metadata: { approvedPayloadHash: payloadHash },
  });

  return { policy, auditId: event.id };
}

export function resetConsentStoreForTests(): void {
  grants.clear();
}
