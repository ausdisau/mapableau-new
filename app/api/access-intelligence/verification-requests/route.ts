import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import {
  AccessIntelligenceError,
  isAccessIntelligenceError,
} from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

const schema = z.object({
  approved: z.literal(true),
  placeId: z.string().min(1),
  questions: z.array(z.string().min(1)).min(1),
  recipient: z.string().min(1),
  purpose: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const raw = await request.json();
    if (raw?.approved === false) {
      recordAuditEvent({
        action: "request_venue_verification",
        actorUserId: userId,
        outcome: "cancelled",
        fieldsShared: [],
      });
      return Response.json({
        error: "Action cancelled.",
        code: "ACTION_CANCELLED",
        recoveryHint: "No message was sent to the venue.",
      });
    }
    const body = schema.safeParse(raw);
    if (!body.success) {
      throw new AccessIntelligenceError(
        "APPROVAL_REQUIRED",
        "Explicit approval is required before contacting a venue.",
        "Review the questions and recipient, then approve.",
      );
    }
    const result = await getAccessIntelligenceRepository().createVerificationRequest({
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
