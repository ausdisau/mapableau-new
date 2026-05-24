import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { userCanAccessWorker } from "@/lib/api/verification-scope";
import { isAdminRole } from "@/lib/auth/roles";
import { runWorkerVerificationChecks } from "@/lib/worker-verification/worker-verification-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  let user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isAdminRole(user.primaryRole)) {
    const permitted = await requireApiPermission("worker:manage:org");
    if (permitted instanceof Response) return permitted;
    user = permitted;
  }

  const { workerId } = await params;
  if (!(await userCanAccessWorker(user, workerId))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const summary = await runWorkerVerificationChecks(workerId, user.id);
    return jsonOk({ summary });
  } catch (e) {
    if (e instanceof Error && e.message === "WORKER_NOT_FOUND") {
      return jsonError("Worker not found", 404);
    }
    throw e;
  }
}
