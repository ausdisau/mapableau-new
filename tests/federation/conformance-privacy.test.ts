import { describe, expect, it } from "vitest";

import { checkPrivacyEnvironment } from "@/lib/federation-conformance/privacy";
import { checkAccessibilityContract } from "@/lib/federation-conformance/accessibility";
import { checkStatusList } from "@/lib/federation-conformance/status-list";
import { checkVcConformance } from "@/lib/federation-conformance/vc-data-model";
import { refuseProductionIssuance } from "@/lib/federation-conformance/oid4vci";
import { refuseProductionPresentation } from "@/lib/federation-conformance/oid4vp";

describe("federation privacy env checks", () => {
  it("passes with clean env", () => {
    const result = checkPrivacyEnvironment({} as unknown as NodeJS.ProcessEnv);
    expect(result.every((f) => f.ok)).toBe(true);
  });

  it("fails when raw user IDs are enabled", () => {
    const result = checkPrivacyEnvironment({
      FEDERATION_ALLOW_RAW_USER_IDS: "true",
    } as unknown as NodeJS.ProcessEnv);
    expect(result.some((f) => !f.ok)).toBe(true);
  });

  it("fails when auto-issue is enabled", () => {
    const result = checkPrivacyEnvironment({
      FEDERATION_ALLOW_AUTO_ISSUE: "true",
    } as unknown as NodeJS.ProcessEnv);
    expect(result.some((f) => f.code === "privacy.auto_issue_allowed")).toBe(
      true
    );
  });

  it("requires FHIR runbook when FHIR outbound is enabled", () => {
    const result = checkPrivacyEnvironment({
      FEDERATION_FHIR_OUTBOUND_ENABLED: "true",
    } as unknown as NodeJS.ProcessEnv);
    expect(result.some((f) => f.code === "privacy.fhir_runbook_missing")).toBe(
      true
    );
  });
});

describe("federation accessibility contract", () => {
  it("passes when disclaimer, banner and screen-reader labels all present", () => {
    const result = checkAccessibilityContract({
      hasPlainLanguageDisclaimer: true,
      hasAmberFederationBanner: true,
      supportsScreenReaderLabels: true,
    });
    expect(result.every((f) => f.ok)).toBe(true);
  });

  it("fails when any control is missing", () => {
    const result = checkAccessibilityContract({
      hasPlainLanguageDisclaimer: false,
      hasAmberFederationBanner: true,
      supportsScreenReaderLabels: true,
    });
    expect(result.some((f) => !f.ok)).toBe(true);
  });

  it("mentions 'not government credentials' in banner requirement", () => {
    const result = checkAccessibilityContract({
      hasPlainLanguageDisclaimer: true,
      hasAmberFederationBanner: false,
      supportsScreenReaderLabels: true,
    });
    const bannerFinding = result.find(
      (f) => f.code === "a11y.amber_banner_missing"
    );
    expect(bannerFinding).toBeDefined();
    expect(bannerFinding!.message.toLowerCase()).toContain(
      "not government"
    );
  });
});

describe("status list conformance", () => {
  const list = (over: Partial<Parameters<typeof checkStatusList>[0]>) =>
    ({
      id: "sl",
      listKey: "k",
      size: 131072,
      encodedList: "",
      privateOnly: true,
      rotationIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...over,
    }) as Parameters<typeof checkStatusList>[0];

  it("rejects under-sized lists", () => {
    const findings = checkStatusList(list({ size: 1024 }));
    expect(findings.some((f) => !f.ok)).toBe(true);
  });

  it("accepts min-size private lists", () => {
    const findings = checkStatusList(list({}));
    expect(findings.every((f) => f.ok)).toBe(true);
  });

  it("rejects public lists without the explicit flag", () => {
    const previous = process.env.FEDERATION_STATUS_LIST_PUBLIC;
    delete process.env.FEDERATION_STATUS_LIST_PUBLIC;
    const findings = checkStatusList(list({ privateOnly: false }));
    expect(findings.some((f) => !f.ok)).toBe(true);
    if (previous !== undefined)
      process.env.FEDERATION_STATUS_LIST_PUBLIC = previous;
  });
});

describe("VC data model syntactic check", () => {
  it("accepts a minimal simulator credential", () => {
    const findings = checkVcConformance({
      id: "c1",
      subjectId: "p1",
      schemaId: "sch1",
      issuerOrganisationId: null,
      credentialSubject: { id: "p1" } as never,
      claimHash: null,
      proofType: "simulator.sha256",
      proofValue: null,
      simulator: true,
      offerId: null,
      effectiveFrom: null,
      effectiveUntil: null,
      revokedAt: null,
      statusListId: null,
      statusListIndex: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    expect(findings.every((f) => f.ok)).toBe(true);
  });

  it("rejects a production credential without a proof value", () => {
    const findings = checkVcConformance({
      id: "c2",
      subjectId: "p1",
      schemaId: "sch1",
      issuerOrganisationId: null,
      credentialSubject: { id: "p1" },
      claimHash: null,
      proofType: "eddsa",
      proofValue: null,
      simulator: false,
      offerId: null,
      effectiveFrom: null,
      effectiveUntil: null,
      revokedAt: null,
      statusListId: null,
      statusListIndex: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    expect(findings.some((f) => f.code === "vc.proof_missing_on_production")).toBe(
      true
    );
  });
});

describe("OID4VCI / OID4VP production guards", () => {
  it("refuses OID4VCI production without activation", () => {
    const previous = process.env.FEDERATION_ACTIVATION;
    process.env.FEDERATION_ACTIVATION = "false";
    expect(() => refuseProductionIssuance("test")).toThrow(
      /oid4vci_production_disabled/
    );
    if (previous !== undefined) process.env.FEDERATION_ACTIVATION = previous;
    else delete process.env.FEDERATION_ACTIVATION;
  });

  it("refuses OID4VP production without activation", () => {
    const previous = process.env.FEDERATION_ACTIVATION;
    process.env.FEDERATION_ACTIVATION = "false";
    expect(() => refuseProductionPresentation("test")).toThrow(
      /oid4vp_production_disabled/
    );
    if (previous !== undefined) process.env.FEDERATION_ACTIVATION = previous;
    else delete process.env.FEDERATION_ACTIVATION;
  });
});
