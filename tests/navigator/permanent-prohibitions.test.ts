import { describe, expect, it } from "vitest";

import { requireAiCapability } from "@/lib/ai/platform";
import { governedNavigatorActionSchema } from "@/intelligence/actions/governed-envelope";

const PROHIBITED = [
  "book_or_cancel_service",
  "approve_or_pay",
  "change_participant_records",
  "determine_ndis_eligibility_or_funding",
  "clinical_recommendation",
  "authorise_restrictive_practice",
  "suspend_participant_worker_or_provider",
  "allege_fraud_abuse_or_misconduct",
  "submit_incident_or_regulatory_report",
  "infer_capacity",
] as const;

describe("Navigator permanent prohibitions", () => {
  it("registers prohibitions on the capability", () => {
    const cap = requireAiCapability("navigator.provider_search_pilot");
    for (const item of PROHIBITED) {
      expect(cap.prohibitedUses).toContain(item);
    }
  });

  it("does not allow prohibited actions as governed envelope types", () => {
    for (const item of PROHIBITED) {
      expect(governedNavigatorActionSchema.safeParse(item).success).toBe(false);
    }
  });

  it("only allows draft, filter transfer, and escalation envelope actions", () => {
    expect(governedNavigatorActionSchema.options).toEqual([
      "create_care_request_draft",
      "transfer_provider_finder_filters",
      "open_human_escalation",
    ]);
  });
});
