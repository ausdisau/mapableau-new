import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  isCommunicationRenderingEnabled,
  isCommunicationsEnabled,
} from "@/lib/config/connected-capability-flags";
import {
  COMMUNICATION_AUDIT_ACTIONS,
  createAuraCommunicationAdapter,
  projectCommunicationPassport,
  renderCommunicationPassport,
} from "@/lib/communications-os";
import { prisma } from "@/lib/prisma";
import {
  TAYLOR_FIXTURE_ID,
  taylorAccessibilityProfile,
} from "@/lib/connected-capability/taylor-fixture";

const bodySchema = z.object({
  fixture: z.enum(["taylor"]).optional(),
  channel: z
    .enum(["screen", "print", "audio", "aura", "handoff_card"])
    .default("screen"),
  presentation: z
    .enum(["plain_language", "easy_read", "structured_json", "one_question"])
    .default("plain_language"),
  locale: z.string().optional(),
});

/**
 * POST meaning-preservation render contract.
 * No external messages. AURA path uses presentation adapter only.
 */
export async function POST(req: Request) {
  if (!isCommunicationsEnabled() || !isCommunicationRenderingEnabled()) {
    return jsonError("Communication rendering is not enabled", 503);
  }

  try {
    const body = bodySchema.parse(await req.json());

    if (body.fixture === "taylor") {
      const passport = projectCommunicationPassport(taylorAccessibilityProfile, {
        participantId: TAYLOR_FIXTURE_ID,
        isSynthetic: true,
      });
      const rendered =
        body.channel === "aura"
          ? createAuraCommunicationAdapter().present(
              passport,
              body.presentation === "structured_json"
                ? "plain_language"
                : body.presentation === "easy_read"
                  ? "easy_read"
                  : body.presentation === "one_question"
                    ? "one_question"
                    : "plain_language"
            )
          : renderCommunicationPassport(passport, {
              channel: body.channel,
              presentation: body.presentation,
              locale: body.locale,
            });
      return jsonOk({
        rendered,
        boundaries: {
          canInferConsent: false,
          canInferCapacity: false,
          canSendExternalMessages: false,
        },
        productionClaimState: "synthetic",
      });
    }

    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const profile = await prisma.accessibilityProfile.findUnique({
      where: { userId: user.id },
    });
    const passport = projectCommunicationPassport(profile, {
      participantId: user.id,
    });
    const rendered = renderCommunicationPassport(passport, {
      channel: body.channel,
      presentation: body.presentation,
      locale: body.locale,
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: COMMUNICATION_AUDIT_ACTIONS.renderRequested,
      entityType: "CommunicationRenderingResponse",
      entityId: passport.id,
      participantId: user.id,
      metadata: {
        channel: body.channel,
        presentation: body.presentation,
      },
    });

    return jsonOk({
      rendered,
      boundaries: {
        canInferConsent: false,
        canInferCapacity: false,
        canSendExternalMessages: false,
      },
      productionClaimState: "internal_alpha",
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Render failed", 500);
  }
}
