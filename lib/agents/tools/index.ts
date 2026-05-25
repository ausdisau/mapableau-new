import type { Tool } from "@strands-agents/sdk";

import * as audit from "./audit-tools";
import * as booking from "./booking-tools";
import * as consent from "./consent-tools";
import * as document from "./document-tools";
import * as invoice from "./invoice-tools";
import * as participant from "./participant-tools";
import * as pricing from "./pricing-tools";
import * as provider from "./provider-tools";
import * as quality from "./quality-tools";
import * as supportDesk from "./support-desk-tools";
import * as telehealth from "./telehealth-tools";
import * as transport from "./transport-tools";

export const ALL_MAPABLE_TOOLS: Tool[] = [
  participant.getParticipantProfileSummary,
  participant.getParticipantAccessNeedsSummary,
  participant.getParticipantConsentStatus,
  participant.getParticipantTimelineSummary,
  provider.searchProviders,
  provider.getProviderPublicProfile,
  provider.getProviderVerificationSummary,
  provider.getProviderCapacitySummary,
  booking.getUpcomingBookings,
  booking.draftBookingRequest,
  booking.checkBookingEligibility,
  booking.createBookingDraftOnly,
  invoice.explainInvoiceTool,
  invoice.getInvoiceSummary,
  invoice.draftInvoiceDispute,
  invoice.runInvoiceValidation,
  invoice.approveInvoiceTool,
  pricing.lookupSupportItem,
  pricing.estimateServiceQuote,
  pricing.explainPricingFinding,
  quality.getQualityActionQueue,
  quality.draftIncidentReport,
  quality.classifyIncidentRisk,
  quality.listIncidentDeadlines,
  quality.createIncidentDraftOnly,
  quality.draftComplaint,
  quality.getComplaintStatus,
  quality.createComplaintDraftOnly,
  quality.draftContinuousImprovementAction,
  quality.getPolicySummary,
  quality.closeIncidentTool,
  transport.findAccessiblePickupPoints,
  transport.checkDriverEligibility,
  transport.draftTransportBooking,
  telehealth.draftTelehealthIntake,
  telehealth.getTelehealthAppointmentSummary,
  telehealth.preparePractitionerReviewSummary,
  document.searchConsentedDocuments,
  document.summariseDocumentForRole,
  document.addDocumentToEvidencePackDraft,
  supportDesk.createSupportTicketDraft,
  supportDesk.classifySupportTicket,
  supportDesk.getSupportTicketStatus,
  consent.checkConsentScopeTool,
  consent.explainConsentScope,
  consent.draftConsentRequest,
  audit.logAgentEvent,
  audit.logToolAccess,
  audit.createHumanApprovalRequest,
];

const TOOL_BY_NAME = new Map(
  ALL_MAPABLE_TOOLS.map((t) => [t.name, t] as const)
);

export function resolveToolsForAgent(allowedTools: string[]): Tool[] {
  return allowedTools
    .map((name) => TOOL_BY_NAME.get(name))
    .filter((t): t is Tool => Boolean(t));
}
