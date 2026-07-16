import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isRecipientDutiesEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import {
  createRecipientObligation,
  listOverdueObligations,
  recordDutyReceipt,
  DUTY_RECEIPT_DISCLAIMER,
} from "@/lib/rights-os/duties/duty-service";

export async function GET(req: Request) {
  if (!isRightsOsEnabled() || !isRecipientDutiesEnabled()) {
    return jsonError("Recipient duties are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId") ?? undefined;
  const overdue = await listOverdueObligations(organisationId);
  return jsonOk({ overdue, disclaimer: DUTY_RECEIPT_DISCLAIMER });
}

export async function POST(req: Request) {
  if (!isRightsOsEnabled() || !isRecipientDutiesEnabled()) {
    return jsonError("Recipient duties are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await req.json()) as {
    action?: string;
    obligationId?: string;
    dutyCode?: string;
    receiptType?: "recipient_attestation" | "system_verified";
    attestationNote?: string;
    capsuleId?: string;
    organisationId?: string;
    purposeCode?: string;
    duties?: Array<{ code: string; description: string }>;
  };

  if (body.action === "create_obligation") {
    const obligation = await createRecipientObligation({
      capsuleId: body.capsuleId,
      organisationId: body.organisationId,
      purposeCode: body.purposeCode ?? "unknown",
      duties: body.duties ?? [{ code: "delete_after_use", description: "Delete after use" }],
    });
    return jsonOk({ obligation }, 201);
  }

  if (body.action === "record_receipt" && body.obligationId && body.dutyCode) {
    const result = await recordDutyReceipt({
      obligationId: body.obligationId,
      dutyCode: body.dutyCode,
      receiptType: body.receiptType ?? "recipient_attestation",
      attestationNote: body.attestationNote,
      actorUserId: user.id,
    });
    return jsonOk(result, 201);
  }

  return jsonError("Invalid action", 400);
}
