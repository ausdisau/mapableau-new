import { randomUUID } from "node:crypto";

import type { z } from "zod";

import {
  upsertCareOSPreference,
} from "@/intelligence/preferences/preference-service";
import { enqueueHumanOpsReview } from "@/lib/ai/platform/human-operations";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  createCareRequest,
  submitCareRequest,
} from "@/lib/care/care-request-service";
import { isHumanOperationsConsoleEnabled } from "@/lib/config/human-operations";
import { sendMessage } from "@/lib/messages/message-service";
import { createTransportTrip } from "@/lib/transport/transport-trip-service";
import { createCareRequestSchema } from "@/lib/validation/care";
import { createTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

import type {
  requestHumanCoordinationPayloadSchema,
  saveParticipantPreferencePayloadSchema,
  sendProviderMessagePayloadSchema,
} from "../schemas";

export type AdapterContext = {
  participantId: string;
  actorId: string;
  user: CurrentUser;
  idempotencyKey: string;
};

export type AdapterResult = {
  entityType: string;
  entityId: string;
  outcomeDetail: string;
};

export async function executeSaveParticipantPreference(
  payload: z.infer<typeof saveParticipantPreferencePayloadSchema>,
  ctx: AdapterContext,
): Promise<AdapterResult> {
  await upsertCareOSPreference({
    participantId: ctx.participantId,
    key: payload.key,
    value: payload.value,
    expiresAt: payload.expiresAt ?? null,
  });
  return {
    entityType: "CareOSParticipantPreference",
    entityId: payload.key,
    outcomeDetail: `Preference "${payload.key}" saved`,
  };
}

export async function executeRequestHumanCoordination(
  payload: z.infer<typeof requestHumanCoordinationPayloadSchema>,
  ctx: AdapterContext,
): Promise<AdapterResult> {
  const coordinationId = randomUUID();

  if (isHumanOperationsConsoleEnabled()) {
    enqueueHumanOpsReview({
      participantId: ctx.participantId,
      tenantId: ctx.participantId,
      missionId: payload.missionId ?? null,
      category: payload.category,
      priority:
        payload.priority === "urgent"
          ? "urgent"
          : payload.priority === "information"
            ? "routine"
            : "attention",
      reasonCodes: [payload.title, payload.summary],
      evidenceRefs: [`coordination:${coordinationId}`],
      requestedBy: ctx.actorId,
      source: "action_kernel",
      sourceReviewItemId: coordinationId,
      participantFacingReason: payload.summary,
    });
  }

  return {
    entityType: "HumanCoordinationRequest",
    entityId: coordinationId,
    outcomeDetail: `Human coordination requested: ${payload.title}`,
  };
}

export async function executeSubmitCareRequest(
  payload: Record<string, unknown>,
  ctx: AdapterContext,
): Promise<AdapterResult> {
  const parsed = createCareRequestSchema.parse(payload);
  const careRequest = await createCareRequest({
    ...parsed,
    preferredDate: parsed.preferredDate
      ? new Date(parsed.preferredDate)
      : undefined,
    participantId: ctx.participantId,
    createdById: ctx.actorId,
  });
  await submitCareRequest(careRequest.id, ctx.actorId);
  return {
    entityType: "CareRequest",
    entityId: careRequest.id,
    outcomeDetail: "Care request submitted for provider review",
  };
}

export async function executeSubmitTransportRequest(
  payload: Record<string, unknown>,
  ctx: AdapterContext,
): Promise<AdapterResult> {
  const parsed = createTransportTripSchema.parse(payload);
  const transport = await createTransportTrip(ctx.user, parsed);
  return {
    entityType: "TransportTrip",
    entityId: transport.trip.id,
    outcomeDetail: "Transport request submitted for provider review",
  };
}

export async function executeSendProviderMessage(
  payload: z.infer<typeof sendProviderMessagePayloadSchema>,
  ctx: AdapterContext,
): Promise<AdapterResult> {
  const message = await sendMessage({
    conversationId: payload.conversationId,
    senderUserId: ctx.actorId,
    body: payload.body,
    plainLanguageSummary: payload.plainLanguageSummary,
  });
  return {
    entityType: "Message",
    entityId: message.id,
    outcomeDetail: "Message sent to provider conversation",
  };
}

export type TestAdapterFn = (
  payload: Record<string, unknown>,
  ctx: AdapterContext,
) => Promise<AdapterResult>;

const testAdapters = new Map<string, TestAdapterFn>();

/** Override adapter execution in tests — never used in production paths. */
export function registerTestActionAdapter(
  actionKey: string,
  fn: TestAdapterFn,
): void {
  testAdapters.set(actionKey, fn);
}

export function clearTestActionAdapters(): void {
  testAdapters.clear();
}

export async function runActionAdapter(
  actionKey: string,
  payload: Record<string, unknown>,
  ctx: AdapterContext,
): Promise<AdapterResult> {
  const testFn = testAdapters.get(actionKey);
  if (testFn) return testFn(payload, ctx);

  switch (actionKey) {
    case "save_participant_preference":
      return executeSaveParticipantPreference(
        payload as z.infer<typeof saveParticipantPreferencePayloadSchema>,
        ctx,
      );
    case "request_human_coordination":
      return executeRequestHumanCoordination(
        payload as z.infer<typeof requestHumanCoordinationPayloadSchema>,
        ctx,
      );
    case "submit_care_request":
      return executeSubmitCareRequest(payload, ctx);
    case "submit_transport_request":
      return executeSubmitTransportRequest(payload, ctx);
    case "send_provider_message":
      return executeSendProviderMessage(
        payload as z.infer<typeof sendProviderMessagePayloadSchema>,
        ctx,
      );
    default:
      throw new Error("UNKNOWN_ACTION_ADAPTER");
  }
}
