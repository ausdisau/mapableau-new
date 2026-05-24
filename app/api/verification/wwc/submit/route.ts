import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getWorkerProfileForUser,
  submitWwcVerification,
} from "@/lib/verification/wwc/wwc-verification-service";
import { wwcSubmitSchema } from "@/lib/validation/wwc";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const worker = await getWorkerProfileForUser(user.id);
  if (!worker) {
    return jsonError("No active worker profile linked to your account", 403);
  }

  const body = await req.json();
  const parsed = wwcSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  try {
    const result = await submitWwcVerification({
      workerProfileId: worker.id,
      organisationId: worker.organisationId,
      actorUserId: user.id,
      input: {
        ...parsed.data,
        jurisdiction: parsed.data.jurisdiction as never,
        checkType: parsed.data.checkType as never,
        dateOfBirth: parsed.data.dateOfBirth ?? null,
        expiresAt: parsed.data.expiresAt ?? null,
        evidenceDocumentId: parsed.data.evidenceDocumentId ?? null,
      },
    });
    return jsonOk(
      {
        verification: {
          id: result.verification.id,
          status: result.verification.status,
          jurisdiction: result.verification.jurisdiction,
          checkType: result.verification.checkType,
        },
      },
      201
    );
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "CONSENT_REQUIRED") {
        return jsonError("Consent confirmation is required", 400);
      }
      if (e.message === "EVIDENCE_NOT_FOUND") {
        return jsonError("Evidence document not found or not accessible", 400);
      }
      if (e.message === "INVALID_CHECK_TYPE_FOR_JURISDICTION") {
        return jsonError("Invalid check type for jurisdiction", 400);
      }
    }
    throw e;
  }
}
