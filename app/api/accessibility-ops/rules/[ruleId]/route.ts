import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import {
  getAccessibilityRule,
  serializeRule,
} from "@/lib/accessibility-ops/rules/rule-registry-service";
import { hasAccessibilityOpsCapability } from "@/lib/accessibility-ops/permissions";
import { mapOpsError, requireOpsFlag } from "@/lib/accessibility-ops/http";

type Params = { params: Promise<{ ruleId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const disabled = requireOpsFlag("ruleRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "rules:read")) {
    return apiForbidden();
  }

  try {
    const { ruleId } = await params;
    const rule = await getAccessibilityRule(ruleId);
    if (!rule) return Response.json({ error: "RULE_NOT_FOUND" }, { status: 404 });
    return Response.json({ rule: serializeRule(rule) });
  } catch (error) {
    return mapOpsError(error);
  }
}
