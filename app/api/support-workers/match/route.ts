import { ZodError, z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  matchSupportWorkers,
  sanitizeMatchForParticipant,
} from "@/lib/matching/support-worker-matching";
import { supportRequestSchema } from "@/lib/validation/support-workers";

export async function POST(req: Request) {
  const user = await requireApiPermission("support_workers:match");
  if (user instanceof Response) return user;

  try {
    const body = supportRequestSchema
      .extend({
        participant_id: z.string().optional(),
      })
      .parse(await req.json());

    let participantId = user.id;
    if (body.participant_id) {
      if (
        !isAdminRole(user.primaryRole) &&
        body.participant_id !== user.id
      ) {
        return jsonError("Forbidden", 403);
      }
      participantId = body.participant_id;
    }

    const { participant_id: _pid, ...request } = body;
    const result = await matchSupportWorkers(request, participantId, user.id);

    if ("skipped" in result && result.skipped) {
      return jsonOk({ skipped: true, matches: [], matchRunId: null });
    }

    return jsonOk({
      matchRunId: result.matchRunId,
      matches: result.matches.map(sanitizeMatchForParticipant),
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Match failed", 500);
  }
}
