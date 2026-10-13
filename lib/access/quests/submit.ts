/**
 * Access Quest submission → normalised MapAble observation (no direct Prisma).
 */

import {
  createUnverifiedProvenance,
  evidenceRefSchema,
  normalizedObservationSchema,
  type NormalizedObservation,
} from "@/lib/integrations/access/contracts";
import { openInfrastructureFlags } from "@/lib/integrations/access/flags";

import { getAccessQuestById } from "./types";
import {
  accessQuestAnswerSchema,
  type AccessQuestAnswer,
} from "./types";

export class AccessQuestError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccessQuestError";
    this.status = status;
  }
}

const seenIdempotency = new Set<string>();

export function __resetQuestIdempotencyForTests(): void {
  seenIdempotency.clear();
}

function mapYesNoUnknown(
  value: AccessQuestAnswer["value"],
): boolean | "UNKNOWN" {
  if (value === "yes" || value === true) return true;
  if (value === "no" || value === false) return false;
  return "UNKNOWN";
}

export function normalizeQuestAnswer(
  raw: unknown,
): NormalizedObservation {
  if (!openInfrastructureFlags.accessQuests) {
    throw new AccessQuestError("Access Quests are disabled", 404);
  }
  const answer = accessQuestAnswerSchema.parse(raw);
  if (seenIdempotency.has(answer.idempotencyKey)) {
    throw new AccessQuestError("Duplicate submission", 409);
  }
  const quest = getAccessQuestById(answer.questId);
  if (!quest) {
    throw new AccessQuestError(`Unknown quest: ${answer.questId}`, 404);
  }
  if (quest.locationRequired && !answer.placeId && (answer.lat == null || answer.lng == null)) {
    throw new AccessQuestError(
      "Location is required for this quest (place or coordinates)",
      400,
    );
  }
  if (!quest.evidenceOptional && !answer.evidenceObjectId) {
    throw new AccessQuestError("Evidence is required for this quest", 400);
  }

  const evidenceRefs = answer.evidenceObjectId
    ? [
        evidenceRefSchema.parse({
          id: answer.evidenceObjectId,
          kind: "image",
          publicationState: "PRIVATE_EVIDENCE",
        }),
      ]
    : [];

  const provenance = createUnverifiedProvenance({
    sourceProvider: "mapable_quests",
    sourceReference: `quest:${quest.id}:${answer.idempotencyKey}`,
    contributorType: "COMMUNITY",
    evidenceRefs,
    attribution: "MapAble Access Quest",
  });

  // Actor identity is intentionally omitted from the public observation payload.
  const observation = normalizedObservationSchema.parse({
    featureType: quest.concept,
    attribute: quest.attribute,
    value:
      quest.answerType === "yes_no_unknown"
        ? mapYesNoUnknown(answer.value)
        : answer.value === "unknown"
          ? "UNKNOWN"
          : answer.value,
    valueQualifier: answer.valueQualifier,
    geometry:
      answer.lat != null && answer.lng != null
        ? { type: "Point", coordinates: [answer.lng, answer.lat] }
        : undefined,
    placeId: answer.placeId,
    notes: answer.note,
    provenance: {
      ...provenance,
      sourceType: "access_quest",
      verificationState: "COMMUNITY_REPORTED",
    },
    claimStrength: "observation",
  });

  seenIdempotency.add(answer.idempotencyKey);
  return observation;
}
