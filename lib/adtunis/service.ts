
import { syncAdtunisConsentToMapAble } from "@/lib/adtunis/consent-adapter";
import { deliverWithIdempotency } from "@/lib/adtunis/messaging-adapter";
import {
  loadWorkspace,
  saveWorkspace,
} from "@/lib/adtunis/workspace-store";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureAdtunisEnabled } from "@/lib/config/adtunis";
import { createSpeechProvider, speechStatus } from "@mapable/adtunis-asr";
import {
  AdtunisActionError,
  applyAction,
  bridgeRequestSchema,
  intentConfirmationSchema,
  recordDelivery,
  workspaceActionSchema,
  type AdtunisWorkspace,
  type WorkspaceAction,
} from "@mapable/adtunis-core";

export function getSpeechStatus() {
  return speechStatus();
}

export async function getWorkspace(participantId: string) {
  ensureAdtunisEnabled();
  return loadWorkspace(participantId);
}

export async function performWorkspaceAction(
  participantId: string,
  raw: unknown,
): Promise<AdtunisWorkspace> {
  ensureAdtunisEnabled();
  const action = workspaceActionSchema.parse(raw);
  const status = speechStatus();
  const state = await loadWorkspace(participantId);
  const next = applyAction(state, action as WorkspaceAction, {
    retentionAvailable: status.retentionAvailable,
  });
  if (action.type === "saveConsent" && action.consent) {
    await syncAdtunisConsentToMapAble({
      participantId,
      consent: action.consent,
    });
  }
  if (action.type === "saveAudioRetention") {
    await syncAdtunisConsentToMapAble({
      participantId,
      consent: next.consent,
      audioRetain: next.audioRetention === "retain-privately",
    });
  }
  return saveWorkspace(participantId, next);
}

export async function recognizeAudio(params: {
  participantId: string;
  audio: Buffer;
  contentType: string;
}): Promise<AdtunisWorkspace> {
  ensureAdtunisEnabled();
  const status = speechStatus();
  if (!status.recognitionReady) {
    throw new AdtunisActionError(status.detail, 503);
  }
  let state = await loadWorkspace(params.participantId);
  if (!state.consent.transcription) {
    throw new AdtunisActionError("Transcription consent is required.", 403);
  }
  if (state.captureState !== "stopped") {
    throw new AdtunisActionError(
      "Stop the recording before requesting recognition.",
    );
  }
  const provider = createSpeechProvider();
  const result = await provider.recognize({
    audio: params.audio,
    contentType: params.contentType,
    profileId: "baseline",
  });
  state = applyAction(state, {
    type: "ingestRecognition",
    recognition: {
      id: crypto.randomUUID(),
      raw: result.raw,
      alternatives: result.alternatives,
      confidence: result.confidence,
      uncertainty: result.uncertainty,
      confirmed: null,
      createdAt: new Date().toISOString(),
    },
  });
  return saveWorkspace(params.participantId, state);
}

export async function confirmIntentDelivery(params: {
  participantId: string;
  body: unknown;
}) {
  ensureAdtunisEnabled();
  const body = intentConfirmationSchema.parse(params.body);
  if (!body.confirmed) {
    throw new AdtunisActionError("Explicit confirmation is required.", 400);
  }

  let state = await loadWorkspace(params.participantId);
  if (body.recognitionId) {
    const recognition = state.recognitions.find(
      (item) => item.id === body.recognitionId,
    );
    if (!recognition) {
      throw new AdtunisActionError("Recognition not found.", 404);
    }
    if (recognition.confirmed !== body.expression) {
      state = applyAction(state, {
        type: "confirmExpression",
        id: body.recognitionId,
        text: body.expression,
      });
    }
  } else if (
    !state.recognitions.some((item) => item.confirmed === body.expression)
  ) {
    state = applyAction(state, {
      type: "confirmExpression",
      text: body.expression,
    });
  }

  const delivery = await deliverWithIdempotency({
    participantId: params.participantId,
    expression: body.expression,
    conversationId: body.conversationId,
    idempotencyKey: body.idempotencyKey,
  });

  state = recordDelivery(state, {
    id: delivery.deliveryId,
    mode: delivery.mode,
    label: delivery.label,
    conversationId: delivery.conversationId,
    expression: body.expression,
    createdAt: new Date().toISOString(),
  });
  await saveWorkspace(params.participantId, state);

  await createAuditEvent({
    actorUserId: params.participantId,
    action: "adtunis.intent_confirmed",
    entityType: "AdtunisDelivery",
    entityId: delivery.deliveryId,
    participantId: params.participantId,
    metadata: {
      mode: delivery.mode,
      simulated: delivery.simulated,
      conversationId: delivery.conversationId,
    },
  });

  return { workspace: state, delivery };
}

export function handleBridge(raw: unknown) {
  ensureAdtunisEnabled();
  const request = bridgeRequestSchema.parse(raw);
  const status = speechStatus();
  if (request.method === "app.getCapabilities") {
    return {
      protocol: request.protocol,
      id: request.id,
      method: request.method,
      ok: true,
      result: JSON.stringify({
        methods: [
          "app.getCapabilities",
          "speech.startCapture",
          "speech.stopCapture",
          "speech.recognize",
        ],
        recognitionReady: status.recognitionReady,
        simulated: status.simulated,
        microphoneOwnedByClient: true,
      }),
    };
  }
  return {
    protocol: request.protocol,
    id: request.id,
    method: request.method,
    ok: false,
    result: JSON.stringify({
      error: "Use the typed Care workspace API for this demo slice.",
      code: "BRIDGE_LIMITED",
    }),
  };
}

export { AdtunisActionError };
