import { describe, expect, it } from "vitest";

import { lookupAbn, parseAbrSearchByAbnXml, scoreNameMatch, validateAbnChecksum } from "@/lib/abn-lookup";
import {
  MOCK_ABN_ACTIVE,
  MOCK_ABN_CANCELLED,
  MOCK_ABN_NAME_MISMATCH,
} from "@/lib/abn-lookup/mock-fixtures";
import { deriveWorkerVerificationRecommendation } from "@/lib/worker-verification/worker-verification-service";
import { isProviderEligibleForMatching } from "@/lib/provider-verification/verification-case-service";

describe("validateAbnChecksum", () => {
  it("accepts valid ABN", () => {
    const r = validateAbnChecksum(MOCK_ABN_ACTIVE);
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.digits).toBe(MOCK_ABN_ACTIVE);
  });

  it("rejects invalid checksum", () => {
    const r = validateAbnChecksum("12345678901");
    expect(r.valid).toBe(false);
  });

  it("rejects wrong length", () => {
    const r = validateAbnChecksum("123");
    expect(r.valid).toBe(false);
  });
});

describe("parseAbrSearchByAbnXml", () => {
  it("parses active entity from XML", () => {
    const xml = `<?xml version="1.0"?>
<ABRPayloadSearchResults>
  <response>
    <businessEntity202001>
      <ABN><identifierValue>53004085616</identifierValue></ABN>
      <entityStatus><entityStatusCode>Active</entityStatusCode></entityStatus>
      <mainName><organisationName>Test Pty Ltd</organisationName></mainName>
      <entityType><entityTypeCode>PRV</entityTypeCode></entityType>
    </businessEntity202001>
  </response>
</ABRPayloadSearchResults>`;
    const r = parseAbrSearchByAbnXml(xml, MOCK_ABN_ACTIVE);
    expect(r.entityStatus).toBe("Active");
    expect(r.entityName).toBe("Test Pty Ltd");
  });

  it("parses exception payload", () => {
    const xml = `<response><exception><exceptionCode>WEBSERVICES</exceptionCode><exceptionDescription>Invalid GUID</exceptionDescription></exception></response>`;
    const r = parseAbrSearchByAbnXml(xml, MOCK_ABN_ACTIVE);
    expect(r.exceptionCode).toBeTruthy();
  });
});

describe("scoreNameMatch", () => {
  it("passes similar organisation names", () => {
    const m = scoreNameMatch("MapAble Demo Services Pty Ltd", [
      "MapAble Demo Services",
    ]);
    expect(m.passed).toBe(true);
    expect(m.matchScore).toBeGreaterThan(0.5);
  });

  it("fails unrelated names", () => {
    const m = scoreNameMatch("Unrelated Holdings International", [
      "Acme NDIS Provider",
    ]);
    expect(m.passed).toBe(false);
  });
});

describe("lookupAbn mock mode", () => {
  it("returns active mock entity", async () => {
    const r = await lookupAbn(MOCK_ABN_ACTIVE);
    expect(r.mode).toBe("mock");
    expect(r.entityStatus).toBe("Active");
  });

  it("returns cancelled mock entity", async () => {
    const r = await lookupAbn(MOCK_ABN_CANCELLED);
    expect(r.entityStatus).toBe("Cancelled");
  });

  it("returns active entity with mismatched name scenario", async () => {
    const r = await lookupAbn(MOCK_ABN_NAME_MISMATCH);
    expect(r.entityStatus).toBe("Active");
    const m = scoreNameMatch(r.entityName, ["Totally Different Org"]);
    expect(m.passed).toBe(false);
  });
});

describe("worker verification recommendation", () => {
  it("recommends verified when credentials and ABN pass", () => {
    const rec = deriveWorkerVerificationRecommendation(
      [
        {
          field: "Worker screening",
          status: "verified",
          required: true,
          passed: true,
        },
        { field: "WWCC", status: "verified", required: true, passed: true },
      ],
      {
        status: "passed",
        abn: MOCK_ABN_ACTIVE,
        entityName: null,
        entityStatus: "Active",
        nameMatchScore: 1,
        message: null,
      }
    );
    expect(rec).toBe("verified");
  });

  it("recommends pending when credentials incomplete", () => {
    const rec = deriveWorkerVerificationRecommendation(
      [
        {
          field: "Worker screening",
          status: "pending_review",
          required: true,
          passed: false,
        },
        { field: "WWCC", status: "verified", required: true, passed: true },
      ],
      {
        status: "skipped",
        abn: "",
        entityName: null,
        entityStatus: null,
        nameMatchScore: null,
        message: null,
      }
    );
    expect(rec).toBe("pending_review");
  });
});

describe("provider matching eligibility", () => {
  it("excludes suspended providers from matching", () => {
    expect(isProviderEligibleForMatching("suspended", "active")).toBe(false);
  });
});
