import { describe, expect, it } from "vitest";

import {
  isProhibitedSchema,
  PROHIBITED_SCHEMA_KEYS,
} from "@/lib/credentials/schemas";
import { refuseAutoIssue } from "@/lib/credentials/issuance";

describe("credential schema prohibitions", () => {
  it("prohibits NDISParticipantCredential", () => {
    expect(isProhibitedSchema("NDISParticipantCredential")).toBe(true);
  });

  it("prohibits MedicalDiagnosisCredential", () => {
    expect(isProhibitedSchema("MedicalDiagnosisCredential")).toBe(true);
  });

  it("prohibits DisabilityCredential", () => {
    expect(isProhibitedSchema("DisabilityCredential")).toBe(true);
  });

  it("prohibits DriverLicenceCredential", () => {
    expect(isProhibitedSchema("DriverLicenceCredential")).toBe(true);
  });

  it("prohibits MedicareCredential", () => {
    expect(isProhibitedSchema("MedicareCredential")).toBe(true);
  });

  it("prohibits PassportCredential", () => {
    expect(isProhibitedSchema("PassportCredential")).toBe(true);
  });

  it("permits a non-government MapAble accessibility summary schema", () => {
    expect(isProhibitedSchema("AccessibilityPassportSummary")).toBe(false);
  });

  it("prohibited set contains at least 6 keys", () => {
    expect(PROHIBITED_SCHEMA_KEYS.size).toBeGreaterThanOrEqual(6);
  });
});

describe("auto-issue policy", () => {
  it("refuses auto-issue unless env override is set", () => {
    const previous = process.env.FEDERATION_ALLOW_AUTO_ISSUE;
    delete process.env.FEDERATION_ALLOW_AUTO_ISSUE;
    expect(() => refuseAutoIssue("test")).toThrow(/auto_issue_refused/);
    if (previous !== undefined) process.env.FEDERATION_ALLOW_AUTO_ISSUE = previous;
  });

  it("allows auto-issue only when env override is explicitly true", () => {
    const previous = process.env.FEDERATION_ALLOW_AUTO_ISSUE;
    process.env.FEDERATION_ALLOW_AUTO_ISSUE = "true";
    expect(() => refuseAutoIssue("test")).not.toThrow();
    if (previous !== undefined) process.env.FEDERATION_ALLOW_AUTO_ISSUE = previous;
    else delete process.env.FEDERATION_ALLOW_AUTO_ISSUE;
  });
});
