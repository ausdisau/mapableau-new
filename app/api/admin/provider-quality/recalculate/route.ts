import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { recalculateProviderQuality } from "@/lib/provider-quality/provider-quality-service";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!body.organisationId) return jsonError("organisationId required", 400);
  const result = await recalculateProviderQuality(
    body.organisationId,
    user.id
  );
  return jsonOk(result);
}
