import type { CandidatePlan } from "@/lib/care-intelligence/counterfactual";
import type {
  CoordinationScenario,
  EvidenceReference,
  SpecialistObservation,
} from "@/lib/care-intelligence/types";

export function buildEvidence(
  scenario: CoordinationScenario,
  safeWorkerIds: string[],
  safeVehicleIds: string[],
  includeMemory: boolean,
): EvidenceReference[] {
  const evidence: EvidenceReference[] = [
    {
      id: "evidence-event",
      sourceType: "scenario",
      sourceId: scenario.journey.id,
      summary: `Observed synthetic disruption: ${scenario.journey.disruption}.`,
    },
    {
      id: "evidence-mandate",
      sourceType: "mandate",
      sourceId: scenario.world.mandate.id,
      summary: `Mandate status ${scenario.world.mandate.status}; level ${scenario.world.mandate.autonomyLevel}; participant confirmation required.`,
    },
    {
      id: "evidence-access",
      sourceType: "preference",
      sourceId: "required-access-features",
      summary: `${scenario.world.requiredAccessFeatures.length} explicit access feature(s) must be preserved.`,
    },
    {
      id: "evidence-continuity",
      sourceType: "preference",
      sourceId: "worker-continuity",
      summary: scenario.world.preferFamiliarWorkers
        ? "The participant explicitly prefers familiar workers."
        : "The participant has not selected a familiar-worker preference.",
    },
    ...(includeMemory
      ? scenario.world.episodicMemory.map((memory) => ({
          id: `evidence-${memory.id}`,
          sourceType: "memory" as const,
          sourceId: memory.id,
          summary: memory.summary,
        }))
      : []),
  ];

  safeWorkerIds.forEach((id) =>
    evidence.push({
      id: `evidence-${id}`,
      sourceType: "candidate",
      sourceId: id,
      summary: "A synthetic worker record passed the content firewall.",
    }),
  );
  safeVehicleIds.forEach((id) =>
    evidence.push({
      id: `evidence-${id}`,
      sourceType: "candidate",
      sourceId: id,
      summary: "A synthetic vehicle record passed the content firewall.",
    }),
  );
  return evidence;
}

export function runSpecialists(params: {
  scenario: CoordinationScenario;
  plans: readonly CandidatePlan[];
  candidateAccessAllowed: boolean;
}): SpecialistObservation[] {
  const { scenario, plans, candidateAccessAllowed } = params;
  const notReached = (
    agent: SpecialistObservation["agent"],
    summary: string,
  ) => ({
    agent,
    status: "not_reached" as const,
    summary,
    confidence: 1,
    evidenceIds: ["evidence-mandate"],
    candidateIds: [],
  });

  const rights: SpecialistObservation = {
    agent: "rights",
    status:
      scenario.participantStop || scenario.world.mandate.status !== "active"
        ? "blocked"
        : "support",
    summary: scenario.participantStop
      ? "Participant stop is active; no further action is supported."
      : "Any proposed change remains inside revocable authority and requires confirmation.",
    confidence: 1,
    evidenceIds: ["evidence-mandate", "evidence-event"],
    candidateIds: [],
  };

  if (
    !candidateAccessAllowed &&
    scenario.journey.disruption !== "vehicle_delay"
  ) {
    return [
      rights,
      notReached("continuity", "Candidate access was not authorised."),
      notReached("accessibility", "Candidate access was not authorised."),
      notReached("journey", "Recovery simulation was not reached."),
      notReached("budget", "Recovery simulation was not reached."),
    ];
  }

  const workerPlans = plans.filter((plan) => plan.worker);
  const familiarPlans = workerPlans.filter(
    (plan) => plan.worker?.familiarToParticipant,
  );
  const vehiclePlans = plans.filter((plan) => plan.vehicle);
  const top = plans[0];
  const cheapest = [...plans].sort(
    (a, b) =>
      a.outcome.priceDeltaCents - b.outcome.priceDeltaCents ||
      b.outcome.utility - a.outcome.utility,
  )[0];

  return [
    rights,
    {
      agent: "continuity",
      status:
        workerPlans.length === 0
          ? "not_reached"
          : familiarPlans.length > 0
            ? "support"
            : "concern",
      summary:
        workerPlans.length === 0
          ? "The worker is unchanged in this scenario."
          : familiarPlans.length > 0
            ? `${familiarPlans.length} plan(s) preserve familiar support.`
            : "No simulated plan preserves worker familiarity.",
      confidence: workerPlans.length > 0 ? 0.96 : 1,
      evidenceIds:
        workerPlans.length > 0
          ? ["evidence-continuity", "evidence-memory-choice-1"]
          : ["evidence-continuity"],
      candidateIds: familiarPlans
        .map((plan) => plan.worker?.id)
        .filter((id): id is string => Boolean(id)),
    },
    {
      agent: "accessibility",
      status:
        vehiclePlans.length === 0
          ? "not_reached"
          : vehiclePlans.every((plan) => plan.outcome.accessRequirementsMet)
            ? "support"
            : "blocked",
      summary:
        vehiclePlans.length === 0
          ? "The vehicle is unchanged in this scenario."
          : "All retained plans preserve every explicit vehicle access requirement.",
      confidence: 1,
      evidenceIds: ["evidence-access"],
      candidateIds: vehiclePlans
        .map((plan) => plan.vehicle?.id)
        .filter((id): id is string => Boolean(id)),
    },
    {
      agent: "journey",
      status: top ? "support" : "concern",
      summary: top
        ? `Plan ${top.id} has the strongest simulated goal fit (${top.outcome.utility}/100).`
        : "No complete recovery plan survived the hard constraints.",
      confidence: top ? Math.max(0.5, 1 - top.outcome.uncertainty) : 1,
      evidenceIds: ["evidence-event"],
      candidateIds: top
        ? [top.worker?.id, top.vehicle?.id].filter((id): id is string =>
            Boolean(id),
          )
        : [],
    },
    {
      agent: "budget",
      status: cheapest ? "support" : "concern",
      summary: cheapest
        ? `Plan ${cheapest.id} has the lowest simulated price change (${cheapest.outcome.priceDeltaCents} cents).`
        : "No plan remains inside the combined delegated price limit.",
      confidence: 1,
      evidenceIds: ["evidence-mandate"],
      candidateIds: cheapest
        ? [cheapest.worker?.id, cheapest.vehicle?.id].filter(
            (id): id is string => Boolean(id),
          )
        : [],
    },
  ];
}

export function describeAgentDisagreement(
  scenario: CoordinationScenario,
  plans: readonly CandidatePlan[],
) {
  const top = plans[0];
  const familiarAlternative = plans.find(
    (plan) => plan.worker?.familiarToParticipant,
  );
  const present = Boolean(
    scenario.world.preferFamiliarWorkers &&
    top?.worker &&
    !top.worker.familiarToParticipant &&
    familiarAlternative &&
    familiarAlternative.id !== top.id,
  );
  return {
    present,
    summary: present
      ? `Journey efficiency favours ${top?.id}; continuity favours ${familiarAlternative?.id}. The participant decides.`
      : "No material specialist disagreement was detected.",
  };
}
