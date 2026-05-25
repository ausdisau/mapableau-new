import type { GraphRepository } from "@/lib/mapable-graphs/repository";
import type { CPSimGraphInput, MDSimGraphInput } from "@/lib/mapable-graphs/types";

export async function buildCPSimInputFromGraphs(
  repo: GraphRepository,
  participantId: string
): Promise<CPSimGraphInput> {
  const [support, booking, assessment, consent, provider] = await Promise.all([
    repo.getGraphForParticipant("support_journey", participantId),
    repo.getGraphForParticipant("booking", participantId),
    repo.getGraphForParticipant("assessment_evidence", participantId),
    repo.getGraphForParticipant("consent", participantId),
    repo.getGraphForParticipant("provider_capability", participantId),
  ]);

  return {
    participantId,
    supportNeeds: support.nodes
      .filter((n) => n.nodeType === "SupportNeed")
      .map((n) => n.label),
    bookings: booking.nodes.map((n) => ({
      type: n.nodeType,
      label: n.label,
      status: n.status,
      ...n.data,
    })),
    assessmentSignals: assessment.nodes
      .filter((n) =>
        ["AssessmentResult", "FunctionalSignal", "DocumentEvidence"].includes(
          n.nodeType
        )
      )
      .map((n) => n.label),
    consentScopes: consent.nodes
      .filter((n) => n.nodeType === "DataScope" && n.status === "active")
      .map((n) => String(n.data.scope ?? n.label)),
    providerCapabilities: provider.nodes
      .filter((n) => n.nodeType === "Capability")
      .map((n) => n.label),
  };
}

export async function buildMDSimInputFromGraphs(
  repo: GraphRepository,
  participantId: string
): Promise<MDSimGraphInput> {
  const [booking, provider, outcome, feedback, guardrail] = await Promise.all([
    repo.getGraphForParticipant("booking", participantId),
    repo.getGraphForParticipant("provider_capability", participantId),
    repo.getGraphForParticipant("outcome", participantId),
    repo.getGraphForParticipant("feedback", participantId),
    repo.getGraphForParticipant("guardrail", participantId),
  ]);

  return {
    participantId,
    bookings: booking.nodes.map((n) => ({ ...n.data, type: n.nodeType })),
    providerReliability: provider.nodes
      .filter((n) => n.nodeType === "Provider" || n.nodeType === "Worker")
      .map((n) => n.data),
    outcomes: outcome.nodes.map((n) => ({ label: n.label, ...n.data })),
    feedbackSignals: feedback.nodes.map((n) => ({
      type: n.nodeType,
      label: n.label,
      ...n.data,
    })),
    guardrailDecisions: guardrail.nodes
      .filter((n) => n.nodeType === "PolicyDecision")
      .map((n) => n.data),
  };
}

/** Booking buffer check for CPSim — flags tight timing between linked bookings. */
export function evaluateBookingBufferWarnings(
  bookings: Array<{
    type: string;
    scheduledEnd?: string;
    scheduledStart?: string;
    label?: string;
  }>,
  minBufferMinutes = 15
): string[] {
  const warnings: string[] = [];
  const care = bookings.find((b) => b.type === "CareBooking");
  const transport = bookings.find((b) => b.type === "TransportBooking");
  const employment = bookings.find((b) => b.type === "EmploymentEvent");

  if (care?.scheduledEnd && transport?.scheduledStart) {
    const end = new Date(care.scheduledEnd).getTime();
    const start = new Date(transport.scheduledStart).getTime();
    const gapMin = (start - end) / 60000;
    if (gapMin < minBufferMinutes) {
      warnings.push(
        `Insufficient buffer between care end and transport pickup (${Math.round(gapMin)} min; recommend ${minBufferMinutes}+ min). Reliability risk for CPSim/MDSim.`
      );
    }
  }

  if (transport?.scheduledStart && employment?.scheduledStart) {
    const tStart = new Date(transport.scheduledStart).getTime();
    const wStart = new Date(employment.scheduledStart).getTime();
    const gapMin = (wStart - tStart) / 60000;
    if (gapMin < 20) {
      warnings.push(
        `Tight timing before work start (${Math.round(gapMin)} min buffer). Reliability risk flagged for MDSim.`
      );
    }
  }

  return warnings;
}
