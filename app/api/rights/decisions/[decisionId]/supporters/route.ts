import { ZodError } from "zod";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isDecisionRoomEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import {
  addSupporterContribution,
  inviteSupporter,
  recordDissent,
} from "@/lib/rights-os/decision-room/decision-room-service";

type RouteParams = { params: Promise<{ decisionId: string }> };

const inviteSchema = z.object({
  supporterUserId: z.string().min(1),
  authorityScope: z.string().min(1),
});

const contributionSchema = z.object({
  supporterId: z.string().min(1),
  content: z.string().min(1),
});

const dissentSchema = z.object({
  supporterId: z.string().min(1),
  content: z.string().min(1),
});

export async function POST(req: Request, { params }: RouteParams) {
  if (!isRightsOsEnabled() || !isDecisionRoomEnabled()) {
    return jsonError("Decision Room is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { decisionId } = await params;
  const body = await req.json();
  const action = (body as { action?: string }).action ?? "invite";

  try {
    if (action === "invite") {
      const parsed = inviteSchema.parse(body);
      const supporter = await inviteSupporter({
        roomId: decisionId,
        supporterUserId: parsed.supporterUserId,
        authorityScope: parsed.authorityScope,
        actorUserId: user.id,
      });
      return jsonOk({ supporter }, 201);
    }

    if (action === "contribute") {
      const parsed = contributionSchema.parse(body);
      const contribution = await addSupporterContribution({
        supporterId: parsed.supporterId,
        content: parsed.content,
        actorUserId: user.id,
      });
      return jsonOk({ contribution }, 201);
    }

    if (action === "dissent") {
      const parsed = dissentSchema.parse(body);
      const dissent = await recordDissent({
        roomId: decisionId,
        supporterId: parsed.supporterId,
        content: parsed.content,
        actorUserId: user.id,
      });
      return jsonOk({ dissent }, 201);
    }

    return jsonError("Unknown action", 400);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Failed", 500);
  }
}
