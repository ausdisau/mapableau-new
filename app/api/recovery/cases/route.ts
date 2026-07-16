import { z } from "zod";

import { withContinuityHandler, disabledIf } from "@/lib/continuity-os/api";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import {
  isRecoveryOptionsEnabled,
  isRecoveryPlaybooksEnabled,
} from "@/lib/continuity-os/feature-flags";
import { createRecoveryCase } from "@/lib/continuity-os/recovery/case-service";

const schema = z.object({
  missionId: z.string().optional(),
  serviceFailureId: z.string().optional(),
  playbookCode: z.string().min(1),
  originalGoal: z.string().min(1),
  horizon: z.string().optional(),
  preferences: z
    .object({
      avoidUnfamiliarWorkers: z.boolean().optional(),
      preserveAppointment: z.boolean().optional(),
      minimiseDisclosure: z.boolean().optional(),
      preferHumanCoordinator: z.boolean().optional(),
    })
    .optional(),
  replacementVehicleAccessible: z.boolean().nullable().optional(),
  simulatedOnly: z.boolean().optional(),
});

export const POST = withContinuityHandler(async (user, request) => {
  const disabled =
    disabledIf(isRecoveryOptionsEnabled(), "RECOVERY_OPTIONS_DISABLED") ||
    disabledIf(isRecoveryPlaybooksEnabled(), "RECOVERY_OPTIONS_DISABLED");
  if (disabled) return disabled;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    throw new ContinuityOsError("VALIDATION_FAILED", "Invalid recovery case.", 400);
  }

  const result = await createRecoveryCase({
    participantId: user.id,
    actorUserId: user.id,
    ...parsed.data,
  });
  return Response.json(result, { status: 201 });
});
