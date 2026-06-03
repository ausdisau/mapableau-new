import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listOpenBackupRecoveries } from "@/lib/care/backup-shift-recovery-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const recoveries = await listOpenBackupRecoveries();
  return jsonOk({ recoveries });
}
