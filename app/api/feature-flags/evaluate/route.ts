import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { evaluateMany } from "@/lib/feature-flags/feature-flag-service";
import { buildEvaluateContext } from "@/lib/feature-flags/server-feature-flag";
export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const keysParam = searchParams.get("keys") ?? "";
  const keys = keysParam.split(",").map((k) => k.trim()).filter(Boolean);

  const context = await buildEvaluateContext(user.id);
  const flags = await evaluateMany(keys, context);

  const publicFlags: Record<string, boolean> = {};
  for (const [key, enabled] of Object.entries(flags)) {
    publicFlags[key] = enabled;
  }

  return jsonOk({ flags: publicFlags });
}
