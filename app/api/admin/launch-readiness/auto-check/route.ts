import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  listLaunchAutoCheckCodes,
  runLaunchAutoCheck,
} from "@/lib/launch-readiness/launch-auto-checks";
import { updateLaunchReadinessItem } from "@/lib/launch-readiness/launch-readiness-service";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return jsonOk({ supportedCodes: listLaunchAutoCheckCodes() });
  }

  const result = await runLaunchAutoCheck(code);
  return jsonOk({ result });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let body: { code?: string; apply?: boolean };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  if (!body.code) return jsonError("code is required");

  const result = await runLaunchAutoCheck(body.code);
  if (!body.apply) {
    return jsonOk({ result });
  }

  if (!result.canAutoApply) {
    return jsonError(
      "Auto-apply not allowed for this check result — update status manually."
    );
  }

  const item = await updateLaunchReadinessItem({
    code: body.code,
    status: result.suggestedStatus,
    actorUserId: user.id,
    notes: `Auto-check: ${result.summary}`,
  });

  return jsonOk({ result, item });
}
