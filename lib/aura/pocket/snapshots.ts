import { auraFlags } from "@/lib/aura/feature-flags";
import { requireMission } from "@/lib/aura/mission/store";
import { hashUserId, saveSnapshot } from "@/lib/aura/pocket/storage";
import type { AuraPocketMissionSnapshot } from "@/lib/aura/pocket/types";
import { assertMissionNotStopped } from "@/lib/aura/stop";
import { appendWitness } from "@/lib/aura/witness";

const SNAPSHOT_EXCLUDED = [
  "diagnosis",
  "full_access_passport",
  "medical_notes",
  "funding_data",
] as const;

export function buildMissionSnapshot(input: {
  missionId: string;
  userId: string;
  presentationPreference?: string;
}): AuraPocketMissionSnapshot {
  if (
    !auraFlags.pocketEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_POCKET_DISABLED");
  }
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);
  if (!mission.plan) throw new Error("AURA_PLAN_MISSING");

  const createdAt = new Date().toISOString();
  const staleAfter = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const route = mission.plan.recommendedRoute;

  const snapshotData: Omit<
    AuraPocketMissionSnapshot,
    "id" | "userIdHash" | "createdAt"
  > = {
    missionId: mission.id,
    missionVersion: mission.planVersions?.length ?? 1,
    planArtifactId: mission.plan.id,
    planVersion: mission.planVersions?.length ?? 1,
    goal: mission.desiredOutcome,
    missionState: mission.status,
    place: {
      id: mission.placeId,
      name: "Harbour Civic Centre (synthetic demo)",
      address: "100 Synthetic Quay, Demo Harbour NSW 2000",
    },
    destination: "Interview Room 3.12",
    visitAt: "tomorrow 10:00 (arrive 09:45)",
    route: route
      ? {
          entrance: route.entranceLabel ?? "Entrance B",
          instructions: [
            "Go to Entrance B.",
            "Enter through the level doorway.",
            "Continue to reception.",
            `Use the ${route.liftLabel ?? "western lift"}.`,
            "Select Level 3.",
            "Follow signs to Room 3.12.",
          ],
          fallbackInstructions: [
            "If western lift fails: do not use Entrance A (steps).",
            "Contact venue for special access or reschedule.",
          ],
        }
      : undefined,
    knownFacts: mission.knownFacts.slice(0, 12),
    blockers: mission.blockers,
    conditions: mission.conditions,
    unknowns: mission.unknowns,
    liveSnapshot: {
      capturedAt: createdAt,
      incidents: ["Western lift operational; toilet state unknown"],
      staleAfter,
    },
    evidenceSummary: (mission.plan.evidence ?? []).slice(0, 8).map((e) => ({
      label: e.evidenceId,
      sourceType: e.sourceType ?? "community",
      observedAt: e.observedAt,
      confidence: e.confidence ?? 0.7,
    })),
    authorisedContacts: [
      {
        label: "Venue reception",
        value: "02 9000 0000",
        purpose: "accessibility assistance",
      },
    ],
    presentationPreference: input.presentationPreference ?? "standard",
    staleAfter,
    syncState: "local_only",
    stopped: false,
  };

  const snapshot = saveSnapshot(input.userId, snapshotData);

  appendWitness({
    missionId: mission.id,
    type: "pocket.snapshot_created",
    summary: "AURA Pocket mission snapshot saved (data-minimised)",
    correlationId: mission.correlationId,
    payload: {
      snapshotId: snapshot.id,
      excluded: [...SNAPSHOT_EXCLUDED],
      userIdHash: hashUserId(input.userId),
    },
  });

  return snapshot;
}

export { SNAPSHOT_EXCLUDED };
