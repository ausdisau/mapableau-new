import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { ContinuityFeatureDisabledError } from "@/lib/continuity-os/mission-extension-service";
import { createRecoveryHandoff } from "@/lib/continuity-os/recovery-case-service";

const schema = z.object({
  missionId: z.string().min(1),
  recoveryCaseId: z.string().optional(),
  sendingOrganisation: z.string().min(1),
  receivingOrganisation: z.string().min(1),
  purpose: z.string().min(1),
  tasks: z.array(z.string()).default([]),
  participantApprovedFields: z.array(z.string()).default([]),
  informationOmitted: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const handoff = await createRecoveryHandoff({
      participantId: user.id,
      actorUserId: user.id,
      ...parsed.data,
    });
    return jsonOk(
      {
        handoffId: handoff.id,
        state: handoff.state,
        note: "A sent handoff is not an accepted handoff.",
      },
      201
    );
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    if (e instanceof Error) return jsonError(e.message, 400);
    throw e;
  }
}
