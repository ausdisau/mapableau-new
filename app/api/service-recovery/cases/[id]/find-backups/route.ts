import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { findBackupOptions } from "@/lib/service-recovery/service-recovery-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "support:manage:any")) {
    return jsonError("Forbidden", 403);
  }

  const { id } = await params;
  const backupOptions = await findBackupOptions(id, user.id);
  return jsonOk({ backupOptions });
}
