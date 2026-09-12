import type {
  ConsentedSupportSummary,
  ParticipantSupportPlanField,
} from "@/lib/ask-mapable/participant-support-plan";

export const PURPOSE_BOUND_SHARE_RECIPIENT_KINDS = [
  "mapable_human",
  "chosen_person",
  "external_service",
] as const;

export type PurposeBoundShareRecipientKind =
  (typeof PURPOSE_BOUND_SHARE_RECIPIENT_KINDS)[number];

export const PURPOSE_BOUND_SHARE_PURPOSES = [
  "ask_for_support",
  "share_communication_access",
  "coordinate_follow_up",
] as const;

export type PurposeBoundSharePurpose =
  (typeof PURPOSE_BOUND_SHARE_PURPOSES)[number];

export const PURPOSE_BOUND_SHARE_EXPIRY_PRESETS = [
  "one_hour",
  "one_day",
  "seven_days",
] as const;

export type PurposeBoundShareExpiryPreset =
  (typeof PURPOSE_BOUND_SHARE_EXPIRY_PRESETS)[number];

export type PurposeBoundShareEnvelopeStatus =
  | "PREPARED"
  | "REVOKED"
  | "EXPIRED";

export type PurposeBoundShareEnvelope = {
  id: string;
  recipient: {
    kind: PurposeBoundShareRecipientKind;
    label: string;
  };
  purpose: PurposeBoundSharePurpose;
  selectedFields: ParticipantSupportPlanField[];
  sections: Array<{ label: string; value: string }>;
  createdAt: string;
  expiresAt: string;
  status: PurposeBoundShareEnvelopeStatus;
  revokedAt: string | null;
  deliveryState: "NOT_SENT";
  sent: false;
  transmissionAuthorised: false;
  externalAcceptanceConfirmed: false;
  consentRecordId: null;
};

export type PurposeBoundShareEnvelopeIssue =
  | "RECIPIENT_REQUIRED"
  | "SUMMARY_REQUIRED";

export type PurposeBoundShareEnvelopeBuildResult =
  | { ok: true; envelope: PurposeBoundShareEnvelope }
  | { ok: false; issues: PurposeBoundShareEnvelopeIssue[] };

const EXPIRY_MS: Record<PurposeBoundShareExpiryPreset, number> = {
  one_hour: 60 * 60 * 1000,
  one_day: 24 * 60 * 60 * 1000,
  seven_days: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Prepares an unsent, non-authorising envelope around a participant-approved
 * support-plan preview. It does not persist data, grant consent, contact a
 * recipient, or create authority to transmit.
 */
export function buildPurposeBoundShareEnvelope(input: {
  envelopeId: string;
  summary: ConsentedSupportSummary;
  recipientKind: PurposeBoundShareRecipientKind;
  recipientLabel: string;
  purpose: PurposeBoundSharePurpose;
  expiryPreset: PurposeBoundShareExpiryPreset;
  now?: Date;
}): PurposeBoundShareEnvelopeBuildResult {
  const recipientLabel = input.recipientLabel.trim().slice(0, 160);
  const issues: PurposeBoundShareEnvelopeIssue[] = [];

  if (!recipientLabel) issues.push("RECIPIENT_REQUIRED");
  if (
    input.summary.selectedFields.length === 0 ||
    input.summary.sections.length === 0
  ) {
    issues.push("SUMMARY_REQUIRED");
  }

  if (issues.length > 0) return { ok: false, issues };

  const now = input.now ?? new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + EXPIRY_MS[input.expiryPreset],
  ).toISOString();

  return {
    ok: true,
    envelope: {
      id: input.envelopeId,
      recipient: {
        kind: input.recipientKind,
        label: recipientLabel,
      },
      purpose: input.purpose,
      selectedFields: [...input.summary.selectedFields],
      sections: input.summary.sections.map((section) => ({ ...section })),
      createdAt,
      expiresAt,
      status: "PREPARED",
      revokedAt: null,
      deliveryState: "NOT_SENT",
      sent: false,
      transmissionAuthorised: false,
      externalAcceptanceConfirmed: false,
      consentRecordId: null,
    },
  };
}

export function getPurposeBoundShareEnvelopeStatus(
  envelope: PurposeBoundShareEnvelope,
  now = new Date(),
): PurposeBoundShareEnvelopeStatus {
  if (envelope.status === "REVOKED" || envelope.revokedAt) return "REVOKED";
  if (now.getTime() >= Date.parse(envelope.expiresAt)) return "EXPIRED";
  return "PREPARED";
}

/**
 * Revokes only this local prepared envelope. Because this slice never sends or
 * persists the envelope, revocation does not imply deletion or external recall.
 */
export function revokePurposeBoundShareEnvelope(
  envelope: PurposeBoundShareEnvelope,
  now = new Date(),
): PurposeBoundShareEnvelope {
  if (envelope.status === "REVOKED") return envelope;

  return {
    ...envelope,
    status: "REVOKED",
    revokedAt: now.toISOString(),
    deliveryState: "NOT_SENT",
    sent: false,
    transmissionAuthorised: false,
    externalAcceptanceConfirmed: false,
    consentRecordId: null,
  };
}
