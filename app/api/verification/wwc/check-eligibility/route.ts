import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canWorkerPerformChildRelatedSupport } from "@/lib/verification/wwc/wwc-eligibility-service";
import { getWorkerProfileForUser } from "@/lib/verification/wwc/wwc-verification-service";
import { wwcEligibilityCheckSchema } from "@/lib/validation/wwc";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = wwcEligibilityCheckSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  let workerProfileId = parsed.data.workerProfileId;
  if (!workerProfileId) {
    const worker = await getWorkerProfileForUser(user.id);
    if (!worker) return jsonError("Worker profile required", 400);
    workerProfileId = worker.id;
  }

  const result = await canWorkerPerformChildRelatedSupport(workerProfileId, {
    participantUnder18: parsed.data.participantUnder18,
    mapableKids: parsed.data.mapableKids,
    schoolTransport: parsed.data.schoolTransport,
    paediatricTherapy: parsed.data.paediatricTherapy,
    youthEmploymentSupport: parsed.data.youthEmploymentSupport,
    safeguardingRestrictionActive: parsed.data.safeguardingRestrictionActive,
    careRequestType: parsed.data.careRequestType as never,
  });

  return jsonOk({ eligibility: result });
}
