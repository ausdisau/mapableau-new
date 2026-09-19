/**
 * Offline draft queue for access missions — idempotent enqueue.
 */

import { randomUUID } from "crypto";

import { openInfrastructureFlags } from "@/lib/integrations/access/flags";

import {
  accessMissionDraftInputSchema,
  accessMissionSchema,
  type AccessMission,
  type AccessMissionDraftInput,
} from "./types";

export class AccessMissionError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccessMissionError";
    this.status = status;
  }
}

const queue: AccessMission[] = [];
const seenKeys = new Set<string>();

export function __resetMissionQueueForTests(): void {
  queue.length = 0;
  seenKeys.clear();
}

export function enqueueMissionDraft(raw: unknown): AccessMission {
  if (!openInfrastructureFlags.accessMissions) {
    throw new AccessMissionError("Access missions disabled", 404);
  }
  const input = accessMissionDraftInputSchema.parse(raw);
  if (seenKeys.has(input.idempotencyKey)) {
    throw new AccessMissionError("Duplicate mission draft", 409);
  }
  const now = new Date().toISOString();
  const mission = accessMissionSchema.parse({
    id: randomUUID(),
    title: input.title,
    description: input.description,
    status: "queued_offline",
    tasks: input.questIds.map((questId, i) => ({
      id: `${questId}-${i}`,
      questId,
      label: `Complete quest ${questId}`,
      status: "pending",
      placeId: input.placeId,
      lat: input.lat,
      lng: input.lng,
    })),
    actorRef: input.actorRef,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: input.idempotencyKey,
  });
  queue.push(mission);
  seenKeys.add(input.idempotencyKey);
  return mission;
}

export function listQueuedMissions(): AccessMission[] {
  return [...queue];
}

export function markMissionReadyToSync(missionId: string): AccessMission {
  const idx = queue.findIndex((m) => m.id === missionId);
  if (idx < 0) throw new AccessMissionError("Mission not found", 404);
  const updated = accessMissionSchema.parse({
    ...queue[idx],
    status: "ready_to_sync",
    updatedAt: new Date().toISOString(),
  });
  queue[idx] = updated;
  return updated;
}

export function createMissionDraftFromInput(
  input: AccessMissionDraftInput,
): AccessMission {
  return enqueueMissionDraft(input);
}
