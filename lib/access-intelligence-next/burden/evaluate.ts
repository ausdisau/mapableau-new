import { runDoorToRoomPreflight } from "../journey/door-to-room-preflight";
import type { AccessQueryAst } from "../query/ast";
import type { AccessBurdenEvent, AccessBurdenProfile } from "./types";

/**
 * Derive system-imposed burden from Harbour preflight confirmations and gaps.
 * Attributes load to organisations/workflows — never scores the participant.
 */
export function buildJourneyBurdenProfile(input: {
  query: AccessQueryAst;
  requirementSetRef: string;
}): AccessBurdenProfile {
  const { preflight } = runDoorToRoomPreflight(input);
  const events: AccessBurdenEvent[] = [];
  let i = 0;

  for (const segment of preflight.segments) {
    if (segment.confirmationRequired) {
      events.push({
        id: `burden-confirm-${i++}`,
        kind: "confirmation",
        summary: segment.confirmationQuestion ?? `Confirm ${segment.label}`,
        attributedTo: segment.responsibleOrganisation,
        attributionType:
          segment.responsibleOrganisation === "system" ||
          segment.responsibleOrganisation === "multi"
            ? "system"
            : "organisation",
        quantity: 1,
        unit: "count",
        journeyRef: preflight.preflightId,
        organisationRef: segment.responsibleOrganisation,
      });
    }
    for (const note of segment.burdenNotes) {
      if (/call/i.test(note)) {
        events.push({
          id: `burden-call-${i++}`,
          kind: "telephone_call",
          summary: note,
          attributedTo: segment.responsibleOrganisation,
          attributionType: "organisation",
          quantity: 1,
          unit: "count",
          journeyRef: preflight.preflightId,
          organisationRef: segment.responsibleOrganisation,
        });
      } else if (/disclosure|repeat/i.test(note)) {
        events.push({
          id: `burden-disc-${i++}`,
          kind: "repeated_disclosure",
          summary: note,
          attributedTo: segment.responsibleOrganisation,
          attributionType: "workflow",
          quantity: 1,
          unit: "count",
          journeyRef: preflight.preflightId,
          organisationRef: segment.responsibleOrganisation,
        });
      } else {
        events.push({
          id: `burden-unc-${i++}`,
          kind: "uncertainty_check",
          summary: note,
          attributedTo: segment.responsibleOrganisation,
          attributionType: "system",
          quantity: 1,
          unit: "count",
          journeyRef: preflight.preflightId,
          organisationRef: segment.responsibleOrganisation,
        });
      }
    }
  }

  // Scenario I style synthetic extras when corridor + lift unknowns stack
  if (preflight.unresolvedHardRequirements.length > 0) {
    events.push({
      id: `burden-form-${i++}`,
      kind: "inaccessible_form",
      summary: "Venue confirmation channel may require inaccessible web form",
      attributedTo: "harbour_civic_venue",
      attributionType: "workflow",
      quantity: 1,
      unit: "count",
      journeyRef: preflight.preflightId,
      organisationRef: "harbour_civic_venue",
    });
  }

  if (
    preflight.dependencyGraph.unverifiedFallbacks.some((f) => /no verified/i.test(f))
  ) {
    events.push({
      id: `burden-detour-${i++}`,
      kind: "detour",
      summary: "Potential unverified detour if lift unavailable (not recommended as compatible)",
      attributedTo: "harbour_civic_venue",
      attributionType: "journey",
      quantity: 600,
      unit: "metres",
      journeyRef: preflight.preflightId,
      organisationRef: "harbour_civic_venue",
    });
  }

  const totals = {
    disclosures: events.filter((e) => e.kind === "repeated_disclosure").length,
    calls: events.filter((e) => e.kind === "telephone_call").length,
    inaccessibleForms: events.filter((e) => e.kind === "inaccessible_form").length,
    detourMetres: events
      .filter((e) => e.kind === "detour" || e.kind === "added_distance")
      .reduce((sum, e) => sum + (e.unit === "metres" ? e.quantity : 0), 0),
    handoffs: events.filter((e) => e.kind === "handoff").length,
    confirmations: events.filter((e) => e.kind === "confirmation").length,
  };

  return {
    profileId: `burden:${preflight.preflightId}`,
    journeyRef: preflight.preflightId,
    events,
    totals,
    notAParticipantScore: true,
    listAlternative: events.map((e) => ({
      id: e.id,
      kind: e.kind,
      summary: e.summary,
      attributedTo: e.attributedTo,
    })),
    limitations: [
      "Burden is attributed to workflows and organisations, not the participant",
      "Not a complexity, worthiness, capability, or independence score",
      "Synthetic estimates only — not live operational telemetry",
    ],
    operatingMode: "synthetic",
    productionClaim: "none",
  };
}
