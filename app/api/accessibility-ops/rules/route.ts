import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import {
  ensureBaselineAccessibilityRules,
  listAccessibilityRules,
  registerAccessibilityRule,
  serializeRule,
} from "@/lib/accessibility-ops/rules/rule-registry-service";
import { emitAccessibilityOpsAudit } from "@/lib/accessibility-ops/audit/emit";
import { hasAccessibilityOpsCapability } from "@/lib/accessibility-ops/permissions";
import { mapOpsError, requireOpsFlag } from "@/lib/accessibility-ops/http";
import type {
  AccessibilityAssetClass,
  AccessibilityAssetType,
  AccessibilityRuleInput,
  AccessibilityRuleVersionInput,
} from "@/lib/accessibility-ops/types";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const disabled = requireOpsFlag("ruleRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "rules:read")) {
    return apiForbidden();
  }

  try {
    const url = new URL(request.url);
    if (url.searchParams.get("ensureBaseline") === "true") {
      await ensureBaselineAccessibilityRules();
    }
    const rules = await listAccessibilityRules();
    return Response.json({ rules: rules.map(serializeRule) });
  } catch (error) {
    return mapOpsError(error);
  }
}

export async function POST(request: Request) {
  const disabled = requireOpsFlag("ruleRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "rules:write")) {
    return apiForbidden();
  }

  try {
    const body = (await request.json()) as {
      rule: AccessibilityRuleInput;
      version: AccessibilityRuleVersionInput;
      applicability?: Array<{
        assetClass?: AccessibilityAssetClass | null;
        assetType?: AccessibilityAssetType | null;
        notes?: string;
      }>;
    };
    const rule = await registerAccessibilityRule(
      body.rule,
      body.version,
      body.applicability
    );
    const correlationId = randomUUID();
    await emitAccessibilityOpsAudit({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "accessibility_ops.rule.created",
      entityType: "AccessibilityRule",
      entityId: rule.id,
      correlationId,
      metadata: { stableKey: rule.stableKey, profile: rule.profile },
    });
    return Response.json(
      { rule: serializeRule(rule), correlationId },
      { status: 201 }
    );
  } catch (error) {
    return mapOpsError(error);
  }
}
