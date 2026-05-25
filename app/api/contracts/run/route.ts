import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { runSmartContract } from "@/lib/contracts/contract-runner";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!body.contractCode || !body.entityType || !body.entityId) {
    return jsonError("contractCode, entityType, entityId required", 400);
  }
  const result = await runSmartContract({
    contractCode: body.contractCode,
    actorUserId: user.id,
    entityType: body.entityType,
    entityId: body.entityId,
    participantId: body.participantId,
    context: body.context ?? {},
  });
  return jsonOk(result);
}
