import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { toggleFeatureFlag } from "@/lib/feature-flags/feature-flag-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const flag = await toggleFeatureFlag(id, user.id);
    return jsonOk({ flag });
  } catch {
    return jsonError("Flag not found", 404);
  }
}
