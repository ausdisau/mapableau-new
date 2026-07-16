import { z } from "zod";

import { withContinuityHandler, disabledIf } from "@/lib/continuity-os/api";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { isHandoffsEnabled } from "@/lib/continuity-os/feature-flags";
import { createHandoff } from "@/lib/continuity-os/recovery/case-service";

const schema = z.object({
  recoveryCaseId: z.string().optional(),
  missionId: z.string().optional(),
  sendingRole: z.string().min(1),
  receivingRole: z.string().min(1),
  purpose: z.string().min(1),
  tasks: z.array(z.unknown()).default([]),
  approvedFields: z.array(z.string()).default([]),
  omittedFields: z.array(z.string()).default([]),
  deadlineAt: z.string().datetime().optional(),
});

export const POST = withContinuityHandler(async (user, request) => {
  const disabled = disabledIf(isHandoffsEnabled(), "HANDOFFS_DISABLED");
  if (disabled) return disabled;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    throw new ContinuityOsError("VALIDATION_FAILED", "Invalid handoff.", 400);
  }

  const handoff = await createHandoff({
    participantId: user.id,
    actorUserId: user.id,
    ...parsed.data,
    deadlineAt: parsed.data.deadlineAt
      ? new Date(parsed.data.deadlineAt)
      : undefined,
  });
  return Response.json({ handoff }, { status: 201 });
});
