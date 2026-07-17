import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isPlatformAssuranceEnabled,
  isWorkerTrustCentreEnabled,
} from "@/lib/config/platform-assurance";
import { buildWorkerTrustGapReport } from "@/lib/worker-trust/gap-report";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isPlatformAssuranceEnabled() && !isWorkerTrustCentreEnabled()) {
    return jsonError("WORKER_TRUST_CENTRE_DISABLED", 403);
  }

  const { searchParams } = new URL(req.url);
  const organisationId = searchParams.get("organisationId") ?? undefined;

  const report = await buildWorkerTrustGapReport({
    organisationId,
    screeningAdapterAvailable: false,
  });
  return jsonOk(report);
}
