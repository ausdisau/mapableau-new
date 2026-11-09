export const PARTICIPANT_ENQUIRY_STATUSES = [
  "draft",
  "sharing_review",
  "submitted",
  "withdrawn",
  "deleted",
] as const;

export type ParticipantEnquiryStatus =
  (typeof PARTICIPANT_ENQUIRY_STATUSES)[number];

/** Provider-facing inbox statuses after synthetic submit. */
export const PROVIDER_INBOX_STATUSES = [
  "new",
  "in_review",
  "needs_information",
  "closed",
] as const;

export type ProviderInboxStatus = (typeof PROVIDER_INBOX_STATUSES)[number];

export const COMMUNICATION_CHANNELS = [
  "text_message",
  "email",
  "phone_call",
  "aac_text_only",
  "supporter_assisted",
] as const;

export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export type EnquirySharePreview = {
  fieldsShared: string[];
  purpose: string;
  providerLabel: string;
  participantNote?: string;
  preferredChannel: CommunicationChannel;
  accessRequirements?: string;
};

export type EnquiryTransitionError =
  | "INVALID_TRANSITION"
  | "NOT_AMENDABLE"
  | "SHARE_REQUIRED"
  | "ALREADY_CLOSED";

const PARTICIPANT_TRANSITIONS: Record<
  ParticipantEnquiryStatus,
  readonly ParticipantEnquiryStatus[]
> = {
  draft: ["sharing_review", "withdrawn", "deleted"],
  sharing_review: ["draft", "submitted", "withdrawn", "deleted"],
  submitted: ["withdrawn", "deleted"],
  withdrawn: ["deleted"],
  deleted: [],
};

const PROVIDER_TRANSITIONS: Record<
  ProviderInboxStatus,
  readonly ProviderInboxStatus[]
> = {
  new: ["in_review", "needs_information", "closed"],
  in_review: ["needs_information", "closed"],
  needs_information: ["in_review", "closed"],
  closed: [],
};

export function canTransitionParticipant(
  from: ParticipantEnquiryStatus,
  to: ParticipantEnquiryStatus,
): boolean {
  return PARTICIPANT_TRANSITIONS[from].includes(to);
}

export function canTransitionProvider(
  from: ProviderInboxStatus,
  to: ProviderInboxStatus,
): boolean {
  return PROVIDER_TRANSITIONS[from].includes(to);
}

export function assertParticipantTransition(
  from: ParticipantEnquiryStatus,
  to: ParticipantEnquiryStatus,
): void {
  if (!canTransitionParticipant(from, to)) {
    throw new Error("INVALID_TRANSITION" satisfies EnquiryTransitionError);
  }
}

export function assertProviderTransition(
  from: ProviderInboxStatus,
  to: ProviderInboxStatus,
): void {
  if (!canTransitionProvider(from, to)) {
    throw new Error("INVALID_TRANSITION" satisfies EnquiryTransitionError);
  }
}

export function isAmendable(status: ParticipantEnquiryStatus): boolean {
  return status === "draft" || status === "sharing_review";
}

export function providerStatusAfterSubmit(): ProviderInboxStatus {
  return "new";
}

export function isProviderVisible(
  participantStatus: ParticipantEnquiryStatus,
  providerStatus: ProviderInboxStatus | null,
): boolean {
  if (participantStatus === "withdrawn" || participantStatus === "deleted") {
    return false;
  }
  return participantStatus === "submitted" && providerStatus !== null;
}
