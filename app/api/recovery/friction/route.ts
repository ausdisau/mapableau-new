import { z } from "zod";

import { withContinuityHandler, disabledIf } from "@/lib/continuity-os/api";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { isFrictionEnabled } from "@/lib/continuity-os/feature-flags";
import {
  recordFrictionEvent,
  summariseFriction,
} from "@/lib/continuity-os/friction/ledger";

const postSchema = z.object({
  missionId: z.string().optional(),
  sourceService: z.string().min(1),
  organisationId: z.string().optional(),
  workflow: z.string().min(1),
  cause: z.string().min(1),
  participantActionRequired: z.boolean().optional(),
  timeBurdenMinutes: z.number().int().optional(),
  travelBurdenKm: z.number().optional(),
  disclosureBurden: z.string().optional(),
  financialBurdenCents: z.number().int().optional(),
  accessibilityBurden: z.string().optional(),
  avoidable: z.boolean().optional(),
  remediationOwner: z.string().optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withContinuityHandler(async (user) => {
  const disabled = disabledIf(isFrictionEnabled(), "FRICTION_DISABLED");
  if (disabled) return disabled;
  const summary = await summariseFriction(user.id);
  return Response.json(summary);
});

export const POST = withContinuityHandler(async (user, request) => {
  const disabled = disabledIf(isFrictionEnabled(), "FRICTION_DISABLED");
  if (disabled) return disabled;

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    throw new ContinuityOsError("VALIDATION_FAILED", "Invalid friction event.", 400);
  }

  const event = await recordFrictionEvent({
    participantId: user.id,
    actorUserId: user.id,
    ...parsed.data,
  });
  return Response.json({ event }, { status: 201 });
});
