import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listProviderScopedBarrierReports } from "@/lib/barrier-report/tenancy";
import { isProviderBarrierInboxEnabled } from "@/lib/config/access-independence";

/**
 * Provider inbox for organisation-bound access barrier reports only.
 * Fail-closed without organisationId on the report (no place→org ownership yet).
 * Never returns reporter contact or triage notes.
 */
export async function GET() {
  const user = await requireApiPermission("care:read:org");
  if (user instanceof Response) return user;

  if (!isProviderBarrierInboxEnabled()) {
    return jsonError(
      "Provider barrier inbox is unavailable until organisation-bound place ownership is configured.",
      503,
    );
  }

  const reports = await listProviderScopedBarrierReports(user);
  return jsonOk({ reports });
}
