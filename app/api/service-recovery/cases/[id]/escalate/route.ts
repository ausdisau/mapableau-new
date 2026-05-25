import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { escalateRecoveryCase } from "@/lib/service-recovery/recovery-escalation-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  if (!body.reason) return jsonError("reason required", 400);
  const result = await escalateRecoveryCase(id, body.reason, user.id);
  return jsonOk(result);
}
