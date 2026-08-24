import { z } from "zod";

import {
  careOSPreferenceKeySchema,
  careOSPreferenceValueSchema,
} from "@/intelligence/preferences/preference-service";
import { createCareRequestSchema } from "@/lib/validation/care";
import { createTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

import { MAPABLE_ACTION_KEYS } from "./types";

export const mapAbleActionKeySchema = z.enum(MAPABLE_ACTION_KEYS);

export const saveParticipantPreferencePayloadSchema = z.object({
  key: careOSPreferenceKeySchema,
  value: careOSPreferenceValueSchema,
  expiresAt: z.string().datetime().nullable().optional(),
});

export const requestHumanCoordinationPayloadSchema = z.object({
  category: z.enum([
    "care_coordination",
    "transport_continuity",
    "access_evidence",
    "general_coordination",
  ]),
  title: z.string().min(3).max(200),
  summary: z.string().min(3).max(2000),
  missionId: z.string().optional(),
  priority: z.enum(["information", "attention", "urgent"]).default("attention"),
});

export const sendProviderMessagePayloadSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1).max(10000),
  plainLanguageSummary: z.string().max(500).optional(),
});

export const submitCareRequestPayloadSchema = createCareRequestSchema;

export const submitTransportRequestPayloadSchema = createTransportTripSchema;

export const createActionProposalInputSchema = z.object({
  missionId: z.string().uuid(),
  traceId: z.string().uuid(),
  actionKey: mapAbleActionKeySchema,
  payload: z.record(z.string(), z.unknown()),
  informationToShare: z.array(z.string()).max(30),
  purpose: z.string().min(3).max(500),
  consentScopes: z.array(z.string()).max(20),
  missionProposalId: z.string().uuid().nullable().optional(),
  expiresInHours: z.number().min(1).max(168).optional(),
});

export const approveActionProposalSchema = z.object({
  consentScopes: z.array(z.string()).max(20),
  confirmedInformationToShare: z.array(z.string()).max(30),
});

export const rejectActionProposalSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const executeActionSchema = z.object({
  proposalId: z.string().uuid(),
  approvalId: z.string().uuid(),
  nonce: z.string().min(16).max(128),
});

export function validateActionPayload(
  actionKey: z.infer<typeof mapAbleActionKeySchema>,
  payload: unknown,
): Record<string, unknown> {
  switch (actionKey) {
    case "save_participant_preference":
      return saveParticipantPreferencePayloadSchema.parse(payload) as Record<
        string,
        unknown
      >;
    case "request_human_coordination":
      return requestHumanCoordinationPayloadSchema.parse(payload) as Record<
        string,
        unknown
      >;
    case "submit_care_request":
      return submitCareRequestPayloadSchema.parse(payload) as Record<
        string,
        unknown
      >;
    case "submit_transport_request":
      return submitTransportRequestPayloadSchema.parse(payload) as Record<
        string,
        unknown
      >;
    case "send_provider_message":
      return sendProviderMessagePayloadSchema.parse(payload) as Record<
        string,
        unknown
      >;
    default: {
      const _never: never = actionKey;
      void _never;
      throw new Error("UNKNOWN_ACTION_KEY");
    }
  }
}
