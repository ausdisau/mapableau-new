export type GovernanceStatus =
  | "ready_to_review"
  | "participant_confirmation_required"
  | "provider_verification_required"
  | "human_review_required"
  | "blocked_by_rule"
  | "attestation_recorded";

export const governanceStatusCopy: Record<
  GovernanceStatus,
  { title: string; description: string; variant: "info" | "warning" | "review" | "blocked" | "success" }
> = {
  ready_to_review: {
    title: "Ready to review",
    description: "Check the summary below. You can edit details before continuing.",
    variant: "info",
  },
  participant_confirmation_required: {
    title: "Your confirmation needed",
    description: "Please confirm you agree to share the selected information.",
    variant: "warning",
  },
  provider_verification_required: {
    title: "Provider verification needed",
    description: "A verified provider credential is required before matching can proceed.",
    variant: "review",
  },
  human_review_required: {
    title: "Human review required",
    description: "A MapAble team member will review this request before it continues.",
    variant: "review",
  },
  blocked_by_rule: {
    title: "Cannot proceed yet",
    description: "A safety or compliance check needs to be resolved first.",
    variant: "blocked",
  },
  attestation_recorded: {
    title: "Confirmation recorded",
    description: "Your confirmation was recorded with a timestamp. This is not a funding guarantee.",
    variant: "success",
  },
};
