import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getRecoveryCaseForParticipant } from "@/lib/continuity-os/recovery-case-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ recoveryId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { recoveryId } = await params;

  const recovery = await getRecoveryCaseForParticipant({
    recoveryId,
    participantId: user.id,
  });
  if (!recovery) return jsonError("Recovery case not found", 404);

  return jsonOk({
    recoveryId,
    receipts: recovery.receipts.map((r) => ({
      id: r.id,
      outcome: r.outcome,
      falseRecovery: r.falseRecovery,
      receipt: r.receiptJson,
      createdAt: r.createdAt,
    })),
  });
}
