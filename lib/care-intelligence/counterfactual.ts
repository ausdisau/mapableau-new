import type {
  CounterfactualOutcome,
  ParticipantWorldState,
  SupportJourney,
  VehicleCandidate,
  WorkerCandidate,
} from "@/lib/care-intelligence/types";

export interface CandidatePlan {
  id: string;
  worker: WorkerCandidate | null;
  vehicle: VehicleCandidate | null;
  outcome: CounterfactualOutcome;
}

export function eligibleWorkers(params: {
  world: ParticipantWorldState;
  candidates: readonly WorkerCandidate[];
}) {
  const { world } = params;
  return params.candidates.filter(
    (candidate) =>
      candidate.availability === "available" &&
      candidate.screening === "valid" &&
      world.mandate.allowedWorkerIds.includes(candidate.id) &&
      Math.abs(candidate.timeShiftMinutes) <=
        world.mandate.maxTimeShiftMinutes &&
      candidate.priceDeltaCents <= world.mandate.maxPriceDeltaCents &&
      world.requiredSupportTags.every((tag) =>
        candidate.supportTags.includes(tag),
      ) &&
      candidate.languages.includes(world.preferredLanguage),
  );
}

export function eligibleVehicles(params: {
  world: ParticipantWorldState;
  candidates: readonly VehicleCandidate[];
}) {
  const { world } = params;
  return params.candidates.filter(
    (candidate) =>
      candidate.availability === "available" &&
      candidate.verification === "verified" &&
      world.mandate.allowedVehicleIds.includes(candidate.id) &&
      Math.abs(candidate.timeShiftMinutes) <=
        world.mandate.maxTimeShiftMinutes &&
      candidate.priceDeltaCents <= world.mandate.maxPriceDeltaCents &&
      world.requiredAccessFeatures.every((feature) =>
        candidate.accessFeatures.includes(feature),
      ),
  );
}

export function simulateRecoveryPlans(params: {
  world: ParticipantWorldState;
  journey: SupportJourney;
  workers: readonly WorkerCandidate[];
  vehicles: readonly VehicleCandidate[];
}): CandidatePlan[] {
  const { world, journey } = params;

  if (journey.disruption === "vehicle_delay") {
    const timeShiftMinutes = journey.delayMinutes;
    const mandateLimitsMet =
      timeShiftMinutes <= world.mandate.maxTimeShiftMinutes;
    return mandateLimitsMet
      ? [
          {
            id: "plan-delay-1",
            worker: null,
            vehicle: null,
            outcome: outcome({
              id: "plan-delay-1",
              world,
              worker: null,
              vehicle: null,
              timeShiftMinutes,
              priceDeltaCents: 0,
              mandateLimitsMet,
            }),
          },
        ]
      : [];
  }

  const needsWorker =
    journey.disruption === "worker_cancelled" ||
    journey.disruption === "linked_cancellation";
  const needsVehicle =
    journey.disruption === "vehicle_cancelled" ||
    journey.disruption === "linked_cancellation";
  const workers: Array<WorkerCandidate | null> = needsWorker
    ? [...params.workers]
    : [null];
  const vehicles: Array<VehicleCandidate | null> = needsVehicle
    ? [...params.vehicles]
    : [null];

  return workers
    .flatMap((worker, workerIndex) =>
      vehicles.map((vehicle, vehicleIndex) => {
        const id = `plan-${workerIndex + 1}-${vehicleIndex + 1}`;
        const timeShiftMinutes = Math.max(
          Math.abs(worker?.timeShiftMinutes ?? 0),
          Math.abs(vehicle?.timeShiftMinutes ?? 0),
        );
        const priceDeltaCents =
          (worker?.priceDeltaCents ?? 0) + (vehicle?.priceDeltaCents ?? 0);
        const mandateLimitsMet =
          timeShiftMinutes <= world.mandate.maxTimeShiftMinutes &&
          priceDeltaCents <= world.mandate.maxPriceDeltaCents;
        return {
          id,
          worker,
          vehicle,
          outcome: outcome({
            id,
            world,
            worker,
            vehicle,
            timeShiftMinutes,
            priceDeltaCents,
            mandateLimitsMet,
          }),
        };
      }),
    )
    .filter((plan) => plan.outcome.mandateLimitsMet)
    .sort(
      (a, b) =>
        b.outcome.utility - a.outcome.utility ||
        a.outcome.uncertainty - b.outcome.uncertainty,
    );
}

function outcome(params: {
  id: string;
  world: ParticipantWorldState;
  worker: WorkerCandidate | null;
  vehicle: VehicleCandidate | null;
  timeShiftMinutes: number;
  priceDeltaCents: number;
  mandateLimitsMet: boolean;
}): CounterfactualOutcome {
  const continuityPreserved = params.worker?.familiarToParticipant ?? true;
  const appointmentLikelyMet =
    params.timeShiftMinutes <= params.world.mandate.maxTimeShiftMinutes;
  const accessRequirementsMet = params.vehicle
    ? params.world.requiredAccessFeatures.every((feature) =>
        params.vehicle?.accessFeatures.includes(feature),
      )
    : true;
  const timePenalty = Math.min(25, params.timeShiftMinutes * 0.8);
  const pricePenalty = Math.min(
    20,
    params.world.mandate.maxPriceDeltaCents > 0
      ? (params.priceDeltaCents / params.world.mandate.maxPriceDeltaCents) * 20
      : params.priceDeltaCents > 0
        ? 20
        : 0,
  );
  const continuityBenefit =
    params.world.preferFamiliarWorkers && continuityPreserved ? 8 : 0;
  const utility = Math.max(
    0,
    Math.round((100 - timePenalty - pricePenalty + continuityBenefit) * 10) /
      10,
  );
  const uncertainty =
    Math.round(
      Math.min(
        0.95,
        0.05 +
          (continuityPreserved ? 0 : 0.18) +
          (params.timeShiftMinutes /
            Math.max(1, params.world.mandate.maxTimeShiftMinutes)) *
            0.1,
      ) * 100,
    ) / 100;

  return {
    planId: params.id,
    workerId: params.worker?.id ?? null,
    vehicleId: params.vehicle?.id ?? null,
    timeShiftMinutes: params.timeShiftMinutes,
    priceDeltaCents: params.priceDeltaCents,
    appointmentLikelyMet,
    accessRequirementsMet,
    continuityPreserved,
    mandateLimitsMet: params.mandateLimitsMet,
    utility,
    uncertainty,
    reasons: [
      accessRequirementsMet
        ? "Every explicit access requirement is preserved."
        : "An explicit access requirement is not met.",
      appointmentLikelyMet
        ? "The simulated time change stays inside the participant mandate."
        : "The simulated time change exceeds the participant mandate.",
      continuityPreserved
        ? "Worker continuity is preserved."
        : "This plan introduces an unfamiliar worker.",
      "This is a deterministic synthetic estimate, not a prediction of a person.",
    ],
  };
}
