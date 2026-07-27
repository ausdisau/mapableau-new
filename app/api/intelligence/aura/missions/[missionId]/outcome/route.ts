import { z } from "zod";

import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getOutcomeForMission,
  recordOutcome,
} from "@/lib/aura/calibration";
import { requireMission } from "@/lib/aura/mission/store";
import type { CurrentUser } from "@/lib/auth/current-user";
import { withAuthorization } from "@/lib/auth/withAuthorization";

export const runtime = "nodejs";

const bodySchema = z.object({
  skipped: z.boolean().optional(),
  missionOutcome: z
    .enum([
      "completed",
      "partially_completed",
      "not_completed",
      "cancelled_by_participant",
      "cancelled_by_service",
      "not_attempted",
      "unknown",
    ])
    .optional(),
  observations: z
    .array(
      z.object({
        category: z.enum([
          "transport",
          "entrance",
          "route",
          "lift",
          "toilet",
          "assistance",
          "supporter",
          "communication",
          "fallback",
          "other",
        ]),
        expected: z.string(),
        observed: z.string(),
        result: z.enum([
          "matched",
          "did_not_match",
          "partly_matched",
          "not_observed",
          "unknown",
        ]),
        source: z.enum([
          "participant_report",
          "application_receipt",
          "venue_response",
          "transport_event",
          "live_status",
          "moderator_result",
        ]),
        evidenceReference: z.string().optional(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .optional(),
  disclosureReview: z
    .object({
      appropriate: z.enum(["yes", "partly", "no", "not_sure"]),
      comment: z.string().optional(),
    })
    .optional(),
  participantComment: z.string().max(4000).optional(),
});

type MissionCtx = { params: Promise<{ missionId: string }> };

export const GET = withAuthorization(
  {},
  async (_req, ctx: MissionCtx, user: CurrentUser) => {
    const { missionId } = await ctx.params;
    try {
      const mission = requireMission(missionId);
      if (mission.participantId !== user.id) {
        return jsonError("Forbidden", 403);
      }
      return jsonOk({ outcome: getOutcomeForMission(missionId) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AURA_ERROR";
      if (message === "AURA_MISSION_NOT_FOUND") {
        return jsonError(message, 404);
      }
      return jsonError(message, 400);
    }
  },
);

/** Outcome write is high-risk — requires session-bound step-up MFA. */
export const POST = withAuthorization(
  { requireMfa: true },
  async (req, ctx: MissionCtx, user: CurrentUser) => {
    const { missionId } = await ctx.params;
    let body: unknown;
    try {
      body = await parseJsonRequestBody(req);
    } catch (e) {
      const err = jsonBodyErrorResponse(e);
      return jsonError(err.message, err.status);
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    try {
      // participantId always from session — never from body (IDOR / hijack).
      const outcome = recordOutcome({
        missionId,
        participantId: user.id,
        ...parsed.data,
      });
      return jsonOk({ outcome });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AURA_ERROR";
      if (message === "AURA_MISSION_FORBIDDEN") {
        return jsonError(message, 403);
      }
      if (message === "AURA_MISSION_NOT_FOUND") {
        return jsonError(message, 404);
      }
      if (message === "MAPABLE_AURA_OUTCOME_CALIBRATION_DISABLED") {
        return jsonError("Outcome calibration is not enabled", 503);
      }
      return jsonError(message, 400);
    }
  },
);

export const PATCH = POST;
