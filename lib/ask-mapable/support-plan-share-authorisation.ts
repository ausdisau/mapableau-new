import {
  PARTICIPANT_SUPPORT_PLAN_FIELDS,
  type ParticipantSupportPlanField,
} from "@/lib/ask-mapable/participant-support-plan";
import { PURPOSE_BOUND_SHARE_PURPOSES } from "@/lib/ask-mapable/purpose-bound-sharing";

const MAX_AUTHORISATION_MS = 7 * 24 * 60 * 60 * 1000;

export type SupportPlanShareAuthorisationInput = {
  envelopeId: string;
  recipientKind: string;
  purpose: string;
  selectedFields: readonly string[];
  expiresAt: string;
};

export type SupportPlanShareAuthorisationIssue =
  | "ENVELOPE_REQUIRED"
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
        sourceAction: "support_plan.share.mapable_human";
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
 * Converts a local prepared-envelope decision into metadata suitable for a
 * one-time MapAble Core consent grant. It deliberately accepts no support-plan
 * section text and performs no persistence or transmission.
 *
 * v1 authorisation is limited to MapAble human support. Participant-entered
 * names for chosen people or external services are labels, not verified
 * identities, so they cannot become transmission authority yet.
 */
export function buildSupportPlanShareAuthorisationConsent(
  input: SupportPlanShareAuthorisationInput,
  now = new Date(),
): SupportPlanShareAuthorisationResult {
  const envelopeId = input.envelopeId.trim();
  if (!envelopeId) {
    return { ok: false, issues: ["ENVELOPE_REQUIRED"] };
  }

  if (input.recipientKind !== "mapable_human") {
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

  const selectedFields = Array.from(new Set(input.selectedFields));
  const expiryMs = Date.parse(input.expiresAt);
  if (!Number.isFinite(expiryMs)) {
    return { ok: false, issues: ["INVALID_EXPIRY"] };
  }

  if (expiryMs <= now.getTime()) {
    return { ok: false, issues: ["EXPIRED"] };
  }

  if (expiryMs - now.getTime() > MAX_AUTHORISATION_MS) {
    return { ok: false, issues: ["EXPIRY_TOO_LONG"] };
  }

  const expiresAt = new Date(expiryMs).toISOString();

  return {
    ok: true,
    consent: {
      scope: "support_profile.read",
      purpose: `support_plan:${input.purpose}`,
      shareMode: "once",
      recipientType: "platform",
      dataScope: selectedFields,
      sourceAction: "support_plan.share.mapable_human",
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
