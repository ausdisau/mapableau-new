import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { participantChooseRecoveryAlternative } from "@/lib/continuity/participant-recovery-service";
import { z } from "zod";

const bodySchema = z
  .object({
    alternativeId: z.string().min(1),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { caseId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const recoveryCase = await participantChooseRecoveryAlternative({
      caseId,
      alternativeId: parsed.data.alternativeId,
      actor: user,
    });
    return jsonOk({ case: recoveryCase });
  } catch (e) {
    if (e instanceof Error && e.message === "FEATURE_DISABLED") {
      return jsonError("Continuity recovery is not enabled", 404);
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "PARTICIPANT_ONLY") {
      return jsonError("Only the participant may choose a recovery option", 403);
    }
    if (e instanceof Error && e.message === "ALTERNATIVE_NOT_FOUND") {
      return jsonError("Alternative not found", 404);
    }
    return jsonError("Forbidden", 403);
  }
}
