import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  applyImportJob,
  validateImportJob,
} from "@/lib/ndis-pricing/catalogue-import-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { jobId } = await params;

  try {
    const job = await validateImportJob(jobId, user.id);
    return jsonOk({ job });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Validation failed";
    return jsonError(msg, 400);
  }
}
