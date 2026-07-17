import type {
  AuraActionRiskTier,
  AuraAuthorityEnvelopeStatus,
} from "@prisma/client";

/**
 * `evaluateAuthority` is the single decision point for whether an agent may
 * perform a specific action for a specific participant right now. It layers:
 *
 *   1. Envelope existence + status (missing/expired/revoked/suspended => deny)
 *   2. Empty permission lists => deny (default deny)
 *   3. Action must be in `allowedActionSlugs`
 *   4. Tool (if any) must be in `allowedToolIds`
 *   5. Financial caps (per-action + envelope-level)
 *   6. Call rate caps (per-session + per-day)
 *   7. Tenant scope (organisation match when the envelope is org-scoped)
 *   8. Consent evaluation result (must be `allowed`)
 *   9. Delegation authority (if actor is a delegate, delegate must be active
 *      and cover this action category)
 *  10. Risk-tier gate: if the action's risk tier is at or above the envelope's
 *      `humanReviewAtOrAboveRiskTier`, the caller MUST provide an approved
 *      approval decision id.
 *
 * This function is intentionally pure so it can be tested without a database.
 */

export interface EvaluationEnvelope {
  id: string;
  status: AuraAuthorityEnvelopeStatus;
  subjectUserId: string;
  agentId: string;
  organisationId: string | null;
  scopePermissions: string[];
  allowedActionSlugs: string[];
  allowedToolIds: string[];
  financialCapDollars: number | null;
  perActionFinancialCapDollars: number | null;
  perSessionCallCap: number | null;
  perDayCallCap: number | null;
  requiresParticipantEachTime: boolean;
  humanReviewAtOrAboveRiskTier: AuraActionRiskTier;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  revokedAt: Date | null;
}

export interface EvaluationAction {
  slug: string;
  riskTier: AuraActionRiskTier;
  prohibited: boolean;
  requiresConsent: boolean;
  estimatedFinancialImpactDollars?: number | null;
}

export interface EvaluationContext {
  now?: Date;
  agentId: string;
  toolId?: string | null;
  actorUserId: string;
  actorIsDelegate?: boolean;
  delegateAuthorityIsActive?: boolean;
  delegateCategoriesGranted?: string[];
  requiredDelegateCategory?: string | null;
  organisationId?: string | null;
  consentDecision:
    | "allowed"
    | "minimised"
    | "denied"
    | "requires_participant_review";
  sessionCallCountSoFar?: number;
  dayCallCountSoFar?: number;
  approvalDecisionId?: string | null;
  approvalDecisionStatus?: "approved" | "rejected" | "pending" | null;
  approvalInputHash?: string | null;
  currentInputHash?: string;
  totalEnvelopeSpendDollars?: number;
}

export type AuthorityDenyCode =
  | "envelope_missing"
  | "envelope_not_active"
  | "envelope_expired"
  | "envelope_revoked"
  | "empty_permissions"
  | "agent_mismatch"
  | "action_prohibited"
  | "action_not_in_allowlist"
  | "tool_not_in_allowlist"
  | "financial_cap_exceeded"
  | "per_action_financial_cap_exceeded"
  | "session_call_cap_exceeded"
  | "day_call_cap_exceeded"
  | "tenant_mismatch"
  | "consent_not_allowed"
  | "delegate_inactive"
  | "delegate_category_missing"
  | "approval_required_for_risk_tier"
  | "approval_not_approved"
  | "approval_input_hash_stale";

export type AuthorityEvaluation =
  | { verdict: "allowed"; envelopeId: string; requiresApprovalHash?: string }
  | {
      verdict: "denied";
      code: AuthorityDenyCode;
      reason: string;
    };

const RISK_TIER_ORDER: Record<AuraActionRiskTier, number> = {
  low_readonly: 0,
  low_readwrite: 1,
  medium_reversible: 2,
  high_irreversible: 3,
  prohibited: 4,
};

export function riskTierAtOrAbove(
  actual: AuraActionRiskTier,
  threshold: AuraActionRiskTier
): boolean {
  return RISK_TIER_ORDER[actual] >= RISK_TIER_ORDER[threshold];
}

export function evaluateAuthority(
  envelope: EvaluationEnvelope | null,
  action: EvaluationAction,
  ctx: EvaluationContext
): AuthorityEvaluation {
  const now = ctx.now ?? new Date();

  if (!envelope) {
    return {
      verdict: "denied",
      code: "envelope_missing",
      reason: "No authority envelope has been granted for this agent/action.",
    };
  }
  if (envelope.revokedAt) {
    return {
      verdict: "denied",
      code: "envelope_revoked",
      reason: "The authority envelope has been revoked.",
    };
  }
  if (envelope.effectiveUntil && envelope.effectiveUntil.getTime() < now.getTime()) {
    return {
      verdict: "denied",
      code: "envelope_expired",
      reason: "The authority envelope has expired.",
    };
  }
  if (envelope.status !== "active") {
    return {
      verdict: "denied",
      code: "envelope_not_active",
      reason: `Envelope is ${envelope.status}, not active.`,
    };
  }
  if (
    envelope.scopePermissions.length === 0 ||
    envelope.allowedActionSlugs.length === 0
  ) {
    return {
      verdict: "denied",
      code: "empty_permissions",
      reason: "Empty permission list — default deny.",
    };
  }
  if (envelope.agentId !== ctx.agentId) {
    return {
      verdict: "denied",
      code: "agent_mismatch",
      reason: "Envelope was granted for a different agent.",
    };
  }
  if (action.prohibited) {
    return {
      verdict: "denied",
      code: "action_prohibited",
      reason: "Action is on the prohibited list and can never be executed.",
    };
  }
  if (!envelope.allowedActionSlugs.includes(action.slug)) {
    return {
      verdict: "denied",
      code: "action_not_in_allowlist",
      reason: "Action is not in the envelope allowlist.",
    };
  }
  if (ctx.toolId && !envelope.allowedToolIds.includes(ctx.toolId)) {
    return {
      verdict: "denied",
      code: "tool_not_in_allowlist",
      reason: "Tool is not in the envelope's allowed tool list.",
    };
  }
  if (
    envelope.organisationId &&
    ctx.organisationId &&
    envelope.organisationId !== ctx.organisationId
  ) {
    return {
      verdict: "denied",
      code: "tenant_mismatch",
      reason: "Actor's organisation does not match the envelope's tenant.",
    };
  }
  if (
    action.requiresConsent &&
    ctx.consentDecision !== "allowed" &&
    ctx.consentDecision !== "minimised"
  ) {
    return {
      verdict: "denied",
      code: "consent_not_allowed",
      reason: `Consent verdict is ${ctx.consentDecision}, not allowed.`,
    };
  }
  if (ctx.actorIsDelegate) {
    if (!ctx.delegateAuthorityIsActive) {
      return {
        verdict: "denied",
        code: "delegate_inactive",
        reason: "Actor is a delegate but the delegate authority is not active.",
      };
    }
    if (
      ctx.requiredDelegateCategory &&
      !(ctx.delegateCategoriesGranted ?? []).includes(
        ctx.requiredDelegateCategory
      )
    ) {
      return {
        verdict: "denied",
        code: "delegate_category_missing",
        reason: "Delegate is not authorised for this action category.",
      };
    }
  }
  const perActionCap = envelope.perActionFinancialCapDollars;
  const estimated = action.estimatedFinancialImpactDollars ?? 0;
  if (perActionCap !== null && estimated > perActionCap) {
    return {
      verdict: "denied",
      code: "per_action_financial_cap_exceeded",
      reason: `Estimated $${estimated} exceeds per-action cap $${perActionCap}.`,
    };
  }
  const envelopeCap = envelope.financialCapDollars;
  const totalSpend = ctx.totalEnvelopeSpendDollars ?? 0;
  if (envelopeCap !== null && totalSpend + estimated > envelopeCap) {
    return {
      verdict: "denied",
      code: "financial_cap_exceeded",
      reason: `Cumulative spend $${totalSpend + estimated} exceeds envelope cap $${envelopeCap}.`,
    };
  }
  if (
    envelope.perSessionCallCap !== null &&
    (ctx.sessionCallCountSoFar ?? 0) >= envelope.perSessionCallCap
  ) {
    return {
      verdict: "denied",
      code: "session_call_cap_exceeded",
      reason: "Per-session call cap reached.",
    };
  }
  if (
    envelope.perDayCallCap !== null &&
    (ctx.dayCallCountSoFar ?? 0) >= envelope.perDayCallCap
  ) {
    return {
      verdict: "denied",
      code: "day_call_cap_exceeded",
      reason: "Per-day call cap reached.",
    };
  }
  const requiresApproval = riskTierAtOrAbove(
    action.riskTier,
    envelope.humanReviewAtOrAboveRiskTier
  );
  if (requiresApproval) {
    if (!ctx.approvalDecisionId || ctx.approvalDecisionStatus !== "approved") {
      return {
        verdict: "denied",
        code: "approval_required_for_risk_tier",
        reason:
          "Action risk tier requires an approved human review before execution.",
      };
    }
    if (
      ctx.approvalInputHash &&
      ctx.currentInputHash &&
      ctx.approvalInputHash !== ctx.currentInputHash
    ) {
      return {
        verdict: "denied",
        code: "approval_input_hash_stale",
        reason:
          "Inputs changed since approval — the approval no longer binds these inputs.",
      };
    }
  }
  return { verdict: "allowed", envelopeId: envelope.id };
}
