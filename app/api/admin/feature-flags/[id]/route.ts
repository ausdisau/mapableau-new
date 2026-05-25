import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getFeatureFlagById,
  updateFeatureFlag,
} from "@/lib/feature-flags/feature-flag-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { id } = await params;
  const flag = await getFeatureFlagById(id);
  if (!flag) return jsonError("Not found", 404);
  return jsonOk({ flag });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();

  const flag = await updateFeatureFlag(
    id,
    {
      name: body.name,
      description: body.description,
      enabled: body.enabled,
      rolloutPercentage: body.rolloutPercentage,
      environment: body.environment,
      moduleArea: body.moduleArea,
      killSwitch: body.killSwitch,
    },
    user.id
  );

  return jsonOk({ flag });
}
