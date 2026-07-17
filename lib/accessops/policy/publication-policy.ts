import type { PolicyDecision, PublicationPolicySubject } from "../types";
import { isRestrictedClassification } from "../types";

export function evaluatePublicationPolicy(
  subject?: PublicationPolicySubject | null,
): PolicyDecision {
  if (!subject) return { allowed: false, reason: "missing_policy_subject" };
  if (isRestrictedClassification(subject.securityClassification))
    return { allowed: false, reason: "restricted_security_classification" };
  if (
    subject.publicVisibility === "never_public" ||
    subject.publicVisibility === "restricted"
  )
    return { allowed: false, reason: "not_publicly_visible" };
  return { allowed: true, reason: "publication_allowed" };
}
