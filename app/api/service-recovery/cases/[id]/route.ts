import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getRecoveryCase } from "@/lib/service-recovery/recovery-case-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const caseRecord = await getRecoveryCase(id);
  if (!caseRecord) return jsonError("Not found", 404);
  if (
    caseRecord.participantId !== user.id &&
    user.primaryRole !== "mapable_admin"
  ) {
    return jsonError("Forbidden", 403);
  }
  return jsonOk({ case: caseRecord });
}
