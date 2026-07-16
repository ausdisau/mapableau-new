import type { ConsentScope as ApiConsentScope } from "@/types/mapable";
import type { ConsentScope as PrmsConsentScope } from "@/lib/prms/types";

/** Maps legacy PRMS consent scopes to canonical Rights purpose codes. */
const PRMS_TO_PURPOSE: Record<PrmsConsentScope, string> = {
  profile_sharing: "supporter.notify_change",
  transport_sharing: "transport.driver_handover",
  plan_management: "analytics.service_quality_aggregate",
  support_coordination: "care.coordinate_shift",
  family_nominee_access: "supporter.notify_change",
  medical_documents: "human_review_required",
  employment_adjustments: "jobs.request_adjustment",
  billing_plan_manager: "analytics.service_quality_aggregate",
  emergency_disclosure: "human_review_required",
  research_opt_in: "research.approved_study",
};

/** Maps API consent scopes to canonical Rights purpose codes. */
const API_TO_PURPOSE: Record<ApiConsentScope, string> = {
  "profile.read": "supporter.notify_change",
  "accessibility.read": "access.share_visit_plan",
  "booking.read": "care.coordinate_shift",
  "booking.manage": "care.coordinate_shift",
  "messages.send": "supporter.notify_change",
  "billing.read": "analytics.service_quality_aggregate",
  "support_coordination.access": "care.coordinate_shift",
  "plan_manager.invoice_access": "analytics.service_quality_aggregate",
  "transport.accessibility_share": "transport.driver_handover",
  "transport.trip_access": "transport.request_trip",
  "care.accessibility_share": "care.worker_handover",
  "support_profile.read": "care.worker_handover",
  "engagement.read_delegate": "supporter.notify_change",
  "engagement.submit_delegate": "supporter.notify_change",
};

export function prmsScopeToPurposeCode(scope: PrmsConsentScope): string {
  return PRMS_TO_PURPOSE[scope];
}

export function apiScopeToPurposeCode(scope: ApiConsentScope): string {
  return API_TO_PURPOSE[scope];
}

export function isHumanReviewPurpose(purposeCode: string): boolean {
  return purposeCode === "human_review_required";
}
