import { checkConsent } from "@/lib/consent/consent-service";
import { isShadowMode, shouldEnforcePurpose } from "@/lib/rights-os/config";
import { evaluatePolicy } from "@/lib/rights-os/policy-evaluator";
import type { RightsDataUseRequestInput } from "@/lib/rights-os/types";

export type EnforcementResult = {
  enforced: boolean;
  allowed: boolean;
  decision?: ReturnType<typeof evaluatePolicy>;
  fallbackToConsent?: boolean;
};

export async function enforcePurposeIfEnabled(params: {
  programme: "transport" | "care" | "jobs" | "access" | "home" | "partners";
  input: RightsDataUseRequestInput;
  consentFallback?: {
    subjectUserId: string;
    scope: Parameters<typeof checkConsent>[0]["scope"];
    grantedToOrganisationId?: string;
    grantedToUserId?: string;
  };
}): Promise<EnforcementResult> {
  const decision = evaluatePolicy(params.input);

  if (isShadowMode() || !shouldEnforcePurpose(params.programme)) {
    return { enforced: false, allowed: true, decision };
  }

  const allowed =
    decision.outcome === "allow" || decision.outcome === "allow_with_duties";

  if (!allowed && params.consentFallback) {
    const consentOk = await checkConsent(params.consentFallback);
    if (consentOk) {
      return { enforced: true, allowed: true, decision, fallbackToConsent: true };
    }
  }

  return { enforced: true, allowed, decision };
}

export const PROGRAMME_PURPOSE_MAP = {
  transport: ["transport.driver_handover", "transport.request_trip"],
  care: ["care.worker_handover", "care.coordinate_shift"],
  jobs: ["jobs.interview_access", "jobs.request_adjustment"],
  access: ["access.verify_venue", "access.share_visit_plan"],
  home: ["home.property_viewing", "home.modification_request"],
  partners: ["access.verify_venue"],
} as const;
