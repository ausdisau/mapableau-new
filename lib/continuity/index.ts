/**
 * Wave 11 — Continuity module barrel.
 *
 * NOTE: `lib/continuity/continuity-intelligence-service.ts` (Y3) is
 * intentionally NOT re-exported here — it stays as its own service.
 */

export * as signalService from "@/lib/continuity/signals/signal-service";
export * as profileService from "@/lib/continuity/profile/profile-service";
export * as standingInstructionService from "@/lib/continuity/profile/standing-instruction-service";
export * as graphService from "@/lib/continuity/graph/graph-service";
export * as correlationService from "@/lib/continuity/detection/correlation-service";
export * as impactService from "@/lib/continuity/impact/impact-service";
export * as caseService from "@/lib/continuity/cases/case-service";
export * as optionBuilder from "@/lib/continuity/recovery/option-builder";
export * as planService from "@/lib/continuity/recovery/plan-service";
export * as executionService from "@/lib/continuity/execution/execution-service";
export * as careAdapter from "@/lib/continuity/adapters/care-adapter";
export * as transportAdapter from "@/lib/continuity/adapters/transport-adapter";
export * as appointmentsAdapter from "@/lib/continuity/adapters/appointments-adapter";
export * as employmentAdapter from "@/lib/continuity/adapters/employment-adapter";
export * as housingAdapter from "@/lib/continuity/adapters/housing-adapter";
export * as providerFailureService from "@/lib/continuity/provider-failure/provider-failure-service";
export * as financeRecoveryService from "@/lib/continuity/finance/finance-recovery-service";
export * as communicationService from "@/lib/continuity/communications/communication-service";
export * as escalationService from "@/lib/continuity/escalation/escalation-service";
export * as reservationService from "@/lib/continuity/reservations/reservation-service";
export * as monitoringService from "@/lib/continuity/monitoring/monitoring-service";
export * as outcomeService from "@/lib/continuity/outcomes/outcome-service";
export * as reliabilityService from "@/lib/continuity/reliability/reliability-service";
export * as civicFeedRegistry from "@/lib/continuity/civic/civic-feed-registry";
