import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { evaluateAssuranceReadiness } from "@/lib/assurance/readiness/evaluate-assurance-readiness";
import { projectAssuranceReadiness } from "@/lib/assurance/readiness/readiness-projection";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireApiPermission("assurance:read");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");
  const result = await evaluateAssuranceReadiness({
    organisationId: organisationId ?? undefined,
  });
  return jsonOk({
    result,
    projection: projectAssuranceReadiness(result),
    disclaimer: "Feature flags are not readiness. Registration is not approval.",
  });
}
