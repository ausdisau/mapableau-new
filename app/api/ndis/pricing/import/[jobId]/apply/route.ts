import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { applyImportJob } from "@/lib/ndis-pricing/catalogue-import-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { jobId } = await params;

  try {
    const result = await applyImportJob(jobId, user.id);
    return jsonOk(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Apply failed";
    if (msg === "INVALID_JOB_STATE") {
      return jsonError("Import job must be validated or approved before apply", 400);
    }
    return jsonError(msg, 400);
  }
}
