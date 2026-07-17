import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isPlatformAssuranceEnabled } from "@/lib/config/platform-assurance";
import { buildAuditReadinessExport } from "@/lib/platform-assurance";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isPlatformAssuranceEnabled()) {
    return jsonError("PLATFORM_ASSURANCE_DISABLED", 403);
  }

  const { id } = await context.params;
  try {
    const pack = await buildAuditReadinessExport(id);
    return jsonOk(pack);
  } catch (error) {
    if (error instanceof Error && error.message === "SCOPE_ASSESSMENT_NOT_FOUND") {
      return jsonError(error.message, 404);
    }
    return jsonError("EXPORT_FAILED", 500);
  }
}
