import { randomUUID } from "crypto";

import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";

import { auraFlags } from "../feature-flags";
import { assertWave6GateForWave7 } from "../pocket/release-gate";
import { requireMission } from "../mission/store";
import { appendWitness } from "../witness";
import type {
  AuraJourneyWorld,
  AuraJourneyWorldEdge,
  AuraJourneyWorldNode,
} from "./types";

const worlds = new Map<string, AuraJourneyWorld[]>();

export function resetWorldModelStore(): void {
  worlds.clear();
}

export function buildJourneyWorld(input: {
  missionId: string;
  userId: string;
}): AuraJourneyWorld {
  if (!auraFlags.worldModelEnabled && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_AURA_WORLD_MODEL_DISABLED");
  }
  try {
    assertWave6GateForWave7();
  } catch {
    if (process.env.MAPABLE_AURA_WAVE6_GATE_PASSED !== "true" && process.env.NODE_ENV !== "test") {
      throw new Error("AURA_WAVE6_GATE_NOT_PASSED");
    }
  }

  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  const nodes: AuraJourneyWorldNode[] = [
    { id: "n-origin", type: "origin", label: "Home", status: "ok" },
    {
      id: "n-appointment",
      type: "appointment",
      label: "Interview Room 3.12 at 10:00",
      status: "ok",
    },
    {
      id: "n-transport",
      type: "transport_service",
      label: "Accessible public transport",
      canonicalId: "gtfs-route-demo-1",
      status: "ok",
      provenance: {
        sourceId: "gtfs-schedule-fixture",
        version: "2026-07-01",
        retrievedAt: new Date().toISOString(),
        trustState: "approved",
      },
    },
    {
      id: "n-station",
      type: "station",
      label: "Central Station",
      status: "ok",
    },
    {
      id: "n-station-ent",
      type: "station_entrance",
      label: "Central Station entrance",
      status: "ok",
    },
    {
      id: "n-pathway",
      type: "station_pathway",
      label: "Station pathway to platform",
      status: "ok",
    },
    { id: "n-platform", type: "platform", label: "Platform 2", status: "ok" },
    {
      id: "n-vehicle",
      type: "vehicle",
      label: "Trip vehicle (accessible per realtime)",
      status: "uncertain",
    },
    { id: "n-stop", type: "stop", label: "Harbour stop", status: "ok" },
    {
      id: "n-curb",
      type: "curb_zone",
      label: "Passenger loading zone",
      status: "ok",
    },
    {
      id: "n-venue",
      type: "venue",
      label: "Harbour Civic Centre",
      canonicalId: HARBOUR_PLACE_ID,
      status: "ok",
    },
    {
      id: "n-ent-b",
      type: "entrance",
      label: "Entrance B",
      canonicalId: `${HARBOUR_PLACE_ID}:entrance-b`,
      status: "ok",
    },
    {
      id: "n-lift-west",
      type: "lift",
      label: "Western lift",
      status: "ok",
    },
    {
      id: "n-dest",
      type: "destination",
      label: "Room 3.12",
      status: "ok",
    },
  ];

  const edges: AuraJourneyWorldEdge[] = [
    { id: "e1", fromNodeId: "n-origin", toNodeId: "n-transport", type: "boards_at", verified: false },
    { id: "e2", fromNodeId: "n-transport", toNodeId: "n-station-ent", type: "travels_via", verified: true, sourceId: "gtfs-schedule-fixture" },
    { id: "e3", fromNodeId: "n-station-ent", toNodeId: "n-pathway", type: "navigates_via", verified: true },
    { id: "e4", fromNodeId: "n-pathway", toNodeId: "n-platform", type: "connects_to", verified: true },
    { id: "e5", fromNodeId: "n-platform", toNodeId: "n-vehicle", type: "boards_at", verified: false },
    { id: "e6", fromNodeId: "n-vehicle", toNodeId: "n-stop", type: "alights_at", verified: false },
    { id: "e7", fromNodeId: "n-stop", toNodeId: "n-curb", type: "connects_to", verified: true },
    { id: "e8", fromNodeId: "n-curb", toNodeId: "n-ent-b", type: "enters_via", verified: true },
    { id: "e9", fromNodeId: "n-ent-b", toNodeId: "n-lift-west", type: "navigates_via", verified: true },
    { id: "e10", fromNodeId: "n-lift-west", toNodeId: "n-dest", type: "connects_to", verified: true },
  ];

  const versions = worlds.get(input.missionId) ?? [];
  const world: AuraJourneyWorld = {
    id: randomUUID(),
    missionId: input.missionId,
    version: versions.length + 1,
    participantContextReference: `participant:${mission.participantId}`,
    passportReference: `passport:authorised-summary`,
    nodes,
    edges,
    sourceVersions: [
      {
        sourceId: "gtfs-schedule-fixture",
        version: "2026-07-01",
        retrievedAt: new Date().toISOString(),
        trustState: "approved",
      },
    ],
    generatedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };

  worlds.set(input.missionId, [...versions, world]);

  appendWitness({
    missionId: input.missionId,
    type: "journey_world.created",
    summary: `Journey world v${world.version} composed`,
    correlationId: mission.correlationId,
    payload: { worldId: world.id, nodeCount: nodes.length },
  });

  return world;
}

export function getLatestWorld(missionId: string): AuraJourneyWorld | null {
  const versions = worlds.get(missionId);
  if (!versions?.length) return null;
  return versions[versions.length - 1]!;
}

export function listWorldVersions(missionId: string): AuraJourneyWorld[] {
  return worlds.get(missionId) ?? [];
}

export function invalidateEdge(input: {
  missionId: string;
  edgeId: string;
  reason: string;
}): AuraJourneyWorld {
  const current = getLatestWorld(input.missionId);
  if (!current) throw new Error("AURA_WORLD_NOT_FOUND");

  const edges = current.edges.map((e) =>
    e.id === input.edgeId ? { ...e, verified: false, label: input.reason } : e,
  );
  const liftNode = current.nodes.find((n) => n.id === "n-lift-west");
  const nodes = current.nodes.map((n) =>
    n.id === "n-lift-west"
      ? { ...n, status: "blocked" as const, label: "Western lift unavailable" }
      : n,
  );

  const versions = worlds.get(input.missionId) ?? [];
  const next: AuraJourneyWorld = {
    ...current,
    id: randomUUID(),
    version: current.version + 1,
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
  };
  worlds.set(input.missionId, [...versions, next]);

  appendWitness({
    missionId: input.missionId,
    type: "journey_dependency.invalidated",
    summary: input.reason,
    correlationId: requireMission(input.missionId).correlationId,
    payload: { edgeId: input.edgeId, previousWorldId: current.id },
  });

  void liftNode;
  return next;
}
