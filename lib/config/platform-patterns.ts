export const platformPatternsConfig = {
  onboardingGateEnabled:
    process.env.ONBOARDING_GATE_ENABLED !== "false",
  journeyPersistenceEnabled:
    process.env.JOURNEY_PERSISTENCE_ENABLED !== "false",
  intakeClassifierEnabled:
    process.env.INTAKE_CLASSIFIER_ENABLED !== "false",
  bookingGraphEnabled: process.env.BOOKING_GRAPH_ENABLED !== "false",
  consentSharingPanelEnabled:
    process.env.CONSENT_SHARING_PANEL_ENABLED !== "false",
  transparentBillingEnabled:
    process.env.TRANSPARENT_BILLING_ENABLED !== "false",
  trustSafetyQueueEnabled:
    process.env.TRUST_SAFETY_QUEUE_ENABLED !== "false",
  agentRunPersistenceEnabled:
    process.env.AGENT_RUN_PERSISTENCE_ENABLED !== "false",
  reliabilityAdvisoryEnabled:
    process.env.RELIABILITY_ADVISORY_ENABLED !== "false",
  matchParticipantConfirmRequired:
    process.env.MATCH_PARTICIPANT_CONFIRM_REQUIRED !== "false",
};
