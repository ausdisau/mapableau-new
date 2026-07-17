import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  buildRecoveryOptions,
  persistRecoveryOptions,
} from "@/lib/continuity/recovery/option-builder";

export const dynamic = "force-dynamic";

const buildSchema = z.object({
  caseId: z.string().min(1),
  participantProhibitedActions: z.array(z.string()).optional(),
  emergencyPolicyRequiresHumanDispatch: z.boolean().optional(),
  hasStandingInstructionForScope: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const raw = await req.json().catch(() => null);
  const parsed = buildSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Invalid options payload", 400);
  const caseRow = await prisma.continuityCase.findUnique({
    where: { id: parsed.data.caseId },
  });
  if (!caseRow) return jsonError("CASE_NOT_FOUND", 404);
  const built = buildRecoveryOptions({
    case: caseRow,
    participantProhibitedActions: parsed.data.participantProhibitedActions,
    emergencyPolicyRequiresHumanDispatch: parsed.data.emergencyPolicyRequiresHumanDispatch ?? true,
    hasStandingInstructionForScope: parsed.data.hasStandingInstructionForScope ?? false,
  });
  const persisted = await persistRecoveryOptions(caseRow.id, built);
  return jsonOk({ options: persisted }, 201);
}
