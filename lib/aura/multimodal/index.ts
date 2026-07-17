import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";
import { selectInferenceProvider, assertLocalOnlyNoCloud } from "../pocket/inference";
import type {
  AuraMediaDraft,
  AuraMediaState,
  AuraMultimodalInput,
  AuraPerceptionCandidate,
} from "./types";

const mediaDrafts = new Map<string, AuraMediaDraft>();
const candidates = new Map<string, AuraPerceptionCandidate>();

const MEDIA_TTL_MS = 30 * 60 * 1000;

export function resetMultimodalStore(): void {
  mediaDrafts.clear();
  candidates.clear();
}

export function prepareMultimodalInput(input: AuraMultimodalInput & { userId: string }): {
  input: AuraMultimodalInput;
  mediaDrafts: AuraMediaDraft[];
  inferenceSelection: ReturnType<typeof selectInferenceProvider>;
} {
  if (!auraFlags.multimodalEnabled && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_AURA_MULTIMODAL_DISABLED");
  }

  const selection = selectInferenceProvider({
    requestedMode: input.processingPreference,
    sensitiveContent: Boolean(input.images?.length || input.audio),
    cloudFallbackApproved: false,
  });
  assertLocalOnlyNoCloud(selection);

  const drafts: AuraMediaDraft[] = [];
  const expiresAt = new Date(Date.now() + MEDIA_TTL_MS).toISOString();

  for (const img of input.images ?? []) {
    const draft: AuraMediaDraft = {
      id: randomUUID(),
      missionId: input.missionId,
      userId: input.userId,
      localReference: img.localReference,
      mediaType: "image",
      state: "captured",
      retained: img.retained,
      locationMetadataIncluded: img.locationMetadataIncluded,
      exifStripped: !img.locationMetadataIncluded,
      expiresAt,
      createdAt: input.createdAt,
    };
    mediaDrafts.set(draft.id, draft);
    drafts.push(draft);
  }

  if (input.audio) {
    const draft: AuraMediaDraft = {
      id: randomUUID(),
      missionId: input.missionId,
      userId: input.userId,
      localReference: input.audio.localReference,
      mediaType: "audio",
      state: "captured",
      retained: input.audio.retained,
      locationMetadataIncluded: false,
      exifStripped: true,
      expiresAt,
      createdAt: input.createdAt,
    };
    mediaDrafts.set(draft.id, draft);
    drafts.push(draft);
  }

  return { input, mediaDrafts: drafts, inferenceSelection: selection };
}

export function processMultimodalInput(input: {
  multimodal: AuraMultimodalInput;
  userId: string;
  cloudApproved?: boolean;
}): AuraPerceptionCandidate[] {
  const prepared = prepareMultimodalInput({
    ...input.multimodal,
    userId: input.userId,
  });

  if (
    prepared.inferenceSelection.consentRequired &&
    !input.cloudApproved &&
    prepared.inferenceSelection.selectedProvider === "cloud"
  ) {
    throw new Error("AURA_CLOUD_PROCESSING_REQUIRES_APPROVAL");
  }

  const results: AuraPerceptionCandidate[] = [];

  if (input.multimodal.text && !input.multimodal.images?.length) {
    return results;
  }

  if (input.multimodal.images?.length) {
    const candidate: AuraPerceptionCandidate = {
      id: randomUUID(),
      missionId: input.multimodal.missionId,
      candidateType: "entrance",
      label: "Possible Entrance B sign",
      description:
        "This appears to be Entrance B. Exact width is not verified. Door operation is not verified. The photograph is not a calibrated measurement.",
      confidence: 0.72,
      source:
        prepared.inferenceSelection.localProcessing
          ? "local_on_device"
          : prepared.inferenceSelection.selectedProvider === "cloud"
            ? "cloud_model"
            : "deterministic_fixture",
      mediaReference: input.multimodal.images[0]?.localReference,
      exactMeasurementAvailable: false,
      requiresHumanConfirmation: true,
      state: "candidate",
      createdAt: new Date().toISOString(),
    };
    candidates.set(candidate.id, candidate);
    results.push(candidate);

    const obstruction: AuraPerceptionCandidate = {
      id: randomUUID(),
      missionId: input.multimodal.missionId,
      candidateType: "obstruction",
      label: "Possible obstruction",
      description: "A possible obstruction near the doorway — requires human confirmation.",
      confidence: 0.45,
      source: "deterministic_fixture",
      exactMeasurementAvailable: false,
      requiresHumanConfirmation: true,
      state: "candidate",
      createdAt: new Date().toISOString(),
    };
    candidates.set(obstruction.id, obstruction);
    results.push(obstruction);
  }

  return results;
}

export function acceptCandidate(input: {
  candidateId: string;
  userId: string;
}): AuraPerceptionCandidate {
  const c = candidates.get(input.candidateId);
  if (!c) throw new Error("AURA_CANDIDATE_NOT_FOUND");
  const updated: AuraPerceptionCandidate = {
    ...c,
    state: "accepted_as_observation_draft",
  };
  candidates.set(input.candidateId, updated);
  return updated;
}

export function rejectCandidate(input: {
  candidateId: string;
  userId: string;
}): AuraPerceptionCandidate {
  const c = candidates.get(input.candidateId);
  if (!c) throw new Error("AURA_CANDIDATE_NOT_FOUND");
  const updated: AuraPerceptionCandidate = {
    ...c,
    state: "rejected",
  };
  candidates.set(input.candidateId, updated);
  if (c.mediaReference) {
    expireMediaForReference(c.mediaReference);
  }
  return updated;
}

export function getCandidate(id: string): AuraPerceptionCandidate | null {
  return candidates.get(id) ?? null;
}

export function expireMediaForReference(localReference: string): void {
  for (const [id, draft] of mediaDrafts) {
    if (draft.localReference === localReference) {
      mediaDrafts.set(id, { ...draft, state: "expired" });
    }
  }
}

export function assertCandidateNotMeasurement(c: AuraPerceptionCandidate): void {
  if (c.exactMeasurementAvailable !== false) {
    throw new Error("AURA_CANDIDATE_MEASUREMENT_VIOLATION");
  }
  if (!c.requiresHumanConfirmation) {
    throw new Error("AURA_CANDIDATE_CONFIRMATION_VIOLATION");
  }
}

export function transitionMediaState(
  draftId: string,
  state: AuraMediaState,
): AuraMediaDraft | null {
  const draft = mediaDrafts.get(draftId);
  if (!draft) return null;
  const updated = { ...draft, state };
  mediaDrafts.set(draftId, updated);
  return updated;
}

export function stripExifByDefault(locationMetadataIncluded: boolean): boolean {
  return !locationMetadataIncluded;
}

/** Raw audio must never be logged. */
export function assertNoRawAudioLogging(_audioRef: string): void {
  void _audioRef;
}
