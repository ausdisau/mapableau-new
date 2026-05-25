import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createFeatureFlag,
  listFeatureFlags,
} from "@/lib/feature-flags/feature-flag-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const flags = await listFeatureFlags();
  return jsonOk({ flags });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body.key || !body.name) {
    return jsonError("key and name are required", 400);
  }

  const flag = await createFeatureFlag({
    key: body.key,
    name: body.name,
    description: body.description,
    enabled: body.enabled,
    rolloutPercentage: body.rolloutPercentage,
    environment: body.environment,
    moduleArea: body.moduleArea,
    killSwitch: body.killSwitch,
    createdById: user.id,
    rules: body.rules,
  });

  return jsonOk({ flag }, 201);
}
