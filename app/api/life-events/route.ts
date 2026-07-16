import { z } from "zod";

import { withContinuityHandler, disabledIf } from "@/lib/continuity-os/api";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { isLifeEventsEnabled } from "@/lib/continuity-os/feature-flags";
import {
  createLifeEventMission,
  listParticipantLifeEvents,
} from "@/lib/continuity-os/missions/life-event-service";

const createSchema = z.object({
  lifeEventTypeCode: z.string().min(1),
  participantGoal: z.string().min(1),
  participantWording: z.string().optional(),
  desiredTiming: z.string().datetime().optional(),
  eventHorizon: z.string().optional(),
  selectedPassportId: z.string().optional(),
  privacyMode: z.string().optional(),
  knownCommitments: z.array(z.string()).optional(),
  unknowns: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
  nonNegotiableRequirements: z.array(z.string()).optional(),
  preferredSupport: z.array(z.string()).optional(),
  humanHelpRequested: z.boolean().optional(),
  safetyConcern: z.boolean().optional(),
  activate: z.boolean().optional(),
});

export const GET = withContinuityHandler(async (user) => {
  const disabled = disabledIf(isLifeEventsEnabled(), "LIFE_EVENTS_DISABLED");
  if (disabled) return disabled;
  const missions = await listParticipantLifeEvents(user.id);
  return Response.json({ missions });
});

export const POST = withContinuityHandler(async (user, request) => {
  const disabled = disabledIf(isLifeEventsEnabled(), "LIFE_EVENTS_DISABLED");
  if (disabled) return disabled;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    throw new ContinuityOsError(
      "VALIDATION_FAILED",
      "Invalid life-event payload.",
      400
    );
  }

  const result = await createLifeEventMission({
    participantId: user.id,
    actorUserId: user.id,
    ...parsed.data,
    desiredTiming: parsed.data.desiredTiming
      ? new Date(parsed.data.desiredTiming)
      : undefined,
  });

  return Response.json(result, { status: 201 });
});
