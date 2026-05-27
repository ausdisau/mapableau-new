import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listDataAccessLogs } from "@/lib/audit/data-access-log-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("data_access:read:any");
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId") ?? undefined;
  const organisationId = searchParams.get("organisationId") ?? undefined;

  const logs = await listDataAccessLogs({
    participantId,
    organisationId,
    limit: 100,
  });

  return jsonOk({ logs });
}
