import { z } from "zod";

import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import { isDemoMode } from "@/lib/access-intelligence/configuration";
import {
  AccessIntelligenceError,
  isAccessIntelligenceError,
} from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";
import { createServerAccessContext } from "@/lib/access-intelligence/server-context";
import { requireApiSession } from "@/lib/api/auth-handler";
import { getCurrentUser } from "@/lib/auth/current-user";

const schema = z.object({
  approved: z.literal(true),
  placeId: z.string().min(1),
  questions: z.array(z.string().min(1)).min(1),
  recipient: z.string().min(1),
  purpose: z.string().min(1),
});

async function resolveUserId(): Promise<string | Response> {
  if (isDemoMode()) {
    const user = await getCurrentUser();
    return user?.id ?? createServerAccessContext({ userId: null }).userId;
  }
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  return session.id;
}

/** Explicit approval endpoint (in addition to AI SDK tool approval in chat). */
export async function POST(request: Request) {
  try {
    const userId = await resolveUserId();
    if (userId instanceof Response) return userId;
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      if ((await request.clone().json().catch(() => null))?.approved === false) {
        recordAuditEvent({
          action: "request_venue_verification",
          actorUserId: userId,
          outcome: "cancelled",
        });
        return Response.json({
          error: "Action cancelled.",
          code: "ACTION_CANCELLED",
          recoveryHint: "No message was sent to the venue.",
        });
      }
      throw new AccessIntelligenceError(
        "APPROVAL_REQUIRED",
        "Explicit approval is required before contacting a venue.",
        "Review the questions and recipient, then approve.",
      );
    }

    const repo = getAccessIntelligenceRepository();
    const result = await repo.createVerificationRequest({
      userId,
      placeId: body.data.placeId,
      questions: body.data.questions,
      recipient: body.data.recipient,
      purpose: body.data.purpose,
    });
    return Response.json({ request: result });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json(
      { error: "Could not send verification request.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
