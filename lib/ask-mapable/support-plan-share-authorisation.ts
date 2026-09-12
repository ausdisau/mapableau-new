import {
  PARTICIPANT_SUPPORT_PLAN_FIELDS,
  type ParticipantSupportPlanField,
} from "@/lib/ask-mapable/participant-support-plan";
import {
  PURPOSE_BOUND_SHARE_PURPOSES,
  getPurposeBoundShareEnvelopeStatus,
  type PurposeBoundShareEnvelope,
} from "@/lib/ask-mapable/purpose-bound-sharing";

const MAX_AUTHORISATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENVELOPE_ID_LENGTH = 120;

export type SupportPlanShareAuthorisationInput = PurposeBoundShareEnvelope;

export type SupportPlanShareAuthorisationIssue =
  | "ENVELOPE_REQUIRED"
  | "INVALID_ENVELOPE"
  | "REVOKED"
  | "UNSUPPORTED_RECIPIENT"
  | "INVALID_PURPOSE"
  | "FIELDS_REQUIRED"
  | "INVALID_FIELDS"
  | "INVALID_EXPIRY"
  | "EXPIRED"
  | "EXPIRY_TOO_LONG";

export type SupportPlanShareAuthorisationResult =
  | {
      ok: true;
      consent: {
        scope: "support_profile.read";
        purpose: string;
        shareMode: "once";
        recipientType: "platform";
        dataScope: ParticipantSupportPlanField[];
        sourceAction: `support_plan.share.mapable_human:${string}`;
        expiryDate: Date;
        recordDisclosureOnGrant: false;
      };
      authorisation: {
        envelopeId: string;
        recipientKind: "mapable_human";
        purpose: string;
        selectedFields: ParticipantSupportPlanField[];
        expiresAt: string;
        transmissionAuthorised: true;
        deliveryState: "NOT_SENT";
        sent: false;
        externalAcceptanceConfirmed: false;
      };
    }
  | { ok: false; issues: SupportPlanShareAuthorisationIssue[] };

function isSupportPlanField(value: string): value is ParticipantSupportPlanField {
  return (PARTICIPANT_SUPPORT_PLAN_FIELDS as readonly string[]).includes(value);
}

function isAllowedPurpose(value: string): boolean {
  return (PURPOSE_BOUND_SHARE_PURPOSES as readonly string[]).includes(value);
}

/**
 * Converts an actual, live prepared envelope into metadata suitable for a
 * one-time MapAble Core consent grant. The full envelope is accepted only so
 * its state can be verified. Participant-authored section text is deliberately
 * excluded from the returned consent and authorisation metadata.
 *
 * v1 authorisation is limited to MapAble human support. Participant-entered
 * names for chosen people or external services are labels, not verified
 * identities, so they cannot become transmission authority yet.
 */
export function buildSupportPlanShareAuthorisationConsent(
  input: SupportPlanShareAuthorisationInput,
  now = new Date(),
): SupportPlanShareAuthorisationResult {
  const envelopeId = input.id.trim();
  if (!envelopeId) {
    return { ok: false, issues: ["ENVELOPE_REQUIRED"] };
  }
  if (envelopeId.length > MAX_ENVELOPE_ID_LENGTH) {
    return { ok: false, issues: ["INVALID_ENVELOPE"] };
  }

  const status = getPurposeBoundShareEnvelopeStatus(input, now);
  if (status === "REVOKED") {
    return { ok: false, issues: ["REVOKED"] };
  }

  const expiryMs = Date.parse(input.expiresAt);
  if (!Number.isFinite(expiryMs)) {
    return { ok: false, issues: ["INVALID_EXPIRY"] };
  }
  if (status === "EXPIRED" || expiryMs <= now.getTime()) {
    return { ok: false, issues: ["EXPIRED"] };
  }
  if (expiryMs - now.getTime() > MAX_AUTHORISATION_MS) {
    return { ok: false, issues: ["EXPIRY_TOO_LONG"] };
  }

  if (input.recipient.kind !== "mapable_human") {
    return { ok: false, issues: ["UNSUPPORTED_RECIPIENT"] };
  }

  if (!isAllowedPurpose(input.purpose)) {
    return { ok: false, issues: ["INVALID_PURPOSE"] };
  }

  if (input.selectedFields.length === 0) {
    return { ok: false, issues: ["FIELDS_REQUIRED"] };
  }

  if (!input.selectedFields.every(isSupportPlanField)) {
    return { ok: false, issues: ["INVALID_FIELDS"] };
  }

  const selectedFields = Array.from(
    new Set(input.selectedFields),
  ) as ParticipantSupportPlanField[];
  const expiresAt = new Date(expiryMs).toISOString();

  return {
    ok: true,
    consent: {
      scope: "support_profile.read",
      purpose: `support_plan:${input.purpose}`,
      shareMode: "once",
      recipientType: "platform",
      dataScope: selectedFields,
      sourceAction: `support_plan.share.mapable_human:${envelopeId}`,
      expiryDate: new Date(expiryMs),
      recordDisclosureOnGrant: false,
    },
    authorisation: {
      envelopeId,
      recipientKind: "mapable_human",
      purpose: input.purpose,
      selectedFields,
      expiresAt,
      transmissionAuthorised: true,
      deliveryState: "NOT_SENT",
      sent: false,
      externalAcceptanceConfirmed: false,
    },
  };
}
