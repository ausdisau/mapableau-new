import { describe, expect, it } from "vitest";

import {
  NON_ENACTED_AUTHORITY_CLASSES,
  REGULATORY_SOURCE_SEEDS,
  isEnactedAuthority,
} from "@/lib/platform-assurance/source-catalogue";
import {
  assertDraftNotTreatedAsLaw,
  assertSourceMutable,
  formatAuthorityClassLabel,
  sourceRequiresHumanPromotion,
} from "@/lib/platform-assurance/source-registry";
import {
  SCOPE_QUESTIONNAIRE_VERSION,
  SCOPE_QUESTIONS,
  suggestScopeResult,
} from "@/lib/platform-assurance/scope-questionnaire";
import { assertMaySetScopeResult } from "@/lib/platform-assurance/scope-assessment-service";
import { platformAssuranceConfig } from "@/lib/config/platform-assurance";
import {
  isTrustCheckPassed,
  mapCredentialStatusToTrustState,
} from "@/lib/worker-trust/gap-report";
import { REGISTRATION_CONTROL_SEEDS } from "@/lib/platform-assurance/control-catalogue";

describe("platform assurance flags", () => {
  it("defaults assurance features off", () => {
    expect(platformAssuranceConfig.platformAssuranceEnabled).toBe(false);
    expect(platformAssuranceConfig.workerTrustCentreEnabled).toBe(false);
  });
});

describe("regulatory source catalogue", () => {
  it("seeds NDIS platform guidance as non-enacted", () => {
    const ndis = REGULATORY_SOURCE_SEEDS.find(
      (s) => s.sourceKey === "ndis_platform_providers"
    );
    expect(ndis).toBeTruthy();
    expect(ndis?.retrievedAt.startsWith("2026-07-16")).toBe(true);
    expect(isEnactedAuthority(ndis!.authorityClass)).toBe(false);
    expect(sourceRequiresHumanPromotion(ndis!.authorityClass)).toBe(true);
  });

  it("labels WAI-Adapt as candidate recommendation", () => {
    const adapt = REGULATORY_SOURCE_SEEDS.find(
      (s) => s.sourceKey === "w3c_wai_adapt_symbols"
    );
    expect(adapt?.authorityClass).toBe("candidate_recommendation");
    expect(formatAuthorityClassLabel(adapt!.authorityClass)).toMatch(
      /Candidate/i
    );
  });

  it("labels DSAPT amendment exposure as draft", () => {
    const draft = REGULATORY_SOURCE_SEEDS.find(
      (s) => s.sourceKey === "dsapt_amendment_2025_exposure"
    );
    expect(draft?.authorityClass).toBe("draft");
    expect(NON_ENACTED_AUTHORITY_CLASSES).toContain("draft");
  });

  it("blocks treating guidance as enacted legal state", () => {
    expect(() =>
      assertDraftNotTreatedAsLaw("implementation_guidance")
    ).toThrow("DRAFT_OR_GUIDANCE_CANNOT_SET_ENACTED_LEGAL_STATE");
  });

  it("enforces source immutability", () => {
    expect(() => assertSourceMutable({ isImmutable: true })).toThrow(
      "REGULATORY_SOURCE_IMMUTABLE"
    );
    expect(() => assertSourceMutable({ isImmutable: false })).not.toThrow();
  });
});

describe("scope questionnaire", () => {
  it("uses dated questionnaire version", () => {
    expect(SCOPE_QUESTIONNAIRE_VERSION).toContain("2026-07-16");
    expect(SCOPE_QUESTIONS.length).toBeGreaterThan(5);
  });

  it("requires legal review for marketplace-like answers with incomplete evidence", () => {
    const result = suggestScopeResult({
      is_online_system: "yes",
      acts_as_intermediary: "yes",
      connects_participants_to_ndis_supports: "yes",
      processes_plan_payments: "yes",
      main_purpose_is_connecting: "yes",
      evidence_complete: "no",
    });
    expect(result).toBe("legal_review_required");
  });

  it("returns insufficient evidence when answers are unknown", () => {
    expect(suggestScopeResult({})).toBe("insufficient_evidence");
  });

  it("prevents non-legal reviewers from setting likely_in_scope", () => {
    expect(() =>
      assertMaySetScopeResult({
        result: "likely_in_scope",
        isLegalReviewer: false,
        status: "draft",
      })
    ).toThrow("LEGAL_REVIEWER_REQUIRED_FOR_SCOPE_OPINION");
  });

  it("allows legal_review_required for assurance officers", () => {
    expect(() =>
      assertMaySetScopeResult({
        result: "legal_review_required",
        isLegalReviewer: false,
        status: "legal_review",
      })
    ).not.toThrow();
  });
});

describe("registration control catalogue", () => {
  it("includes scope and screening controls", () => {
    const codes = REGISTRATION_CONTROL_SEEDS.map((c) => c.code);
    expect(codes).toContain("PA-SCOPE-001");
    expect(codes).toContain("PA-SCREEN-001");
  });
});

describe("worker trust gap mapping", () => {
  it("never treats not_provided as passed", () => {
    const state = mapCredentialStatusToTrustState("not_provided", {
      screeningAdapterAvailable: false,
    });
    expect(state).toBe("check_unavailable");
    expect(isTrustCheckPassed(state)).toBe(false);
  });

  it("maps verified to verified_current only as passed", () => {
    expect(isTrustCheckPassed(mapCredentialStatusToTrustState("verified"))).toBe(
      true
    );
    expect(isTrustCheckPassed(mapCredentialStatusToTrustState("expired"))).toBe(
      false
    );
    expect(
      isTrustCheckPassed(mapCredentialStatusToTrustState("pending_review"))
    ).toBe(false);
  });
});
