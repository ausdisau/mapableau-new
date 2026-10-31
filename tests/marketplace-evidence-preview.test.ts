import { describe, expect, it } from "vitest";

import {
  EVIDENCE_DEMO_LISTINGS,
  canAddToLocalDraft,
  findEvidence,
  makeLocalEnquiryDraft,
  searchEvidenceListings,
} from "../packages/marketplace-evidence/src/index";

describe("marketplace evidence-first synthetic preview", () => {
  it("contains only explicitly synthetic supplier labels and unconfirmed availability", () => {
    expect(EVIDENCE_DEMO_LISTINGS).toHaveLength(6);
    for (const listing of EVIDENCE_DEMO_LISTINGS) {
      expect(listing.sellerLabel).toMatch(/^Synthetic supplier /);
      expect(listing.availability).toBe("unconfirmed");
      expect(listing.fundingAssessment).toBe("not_assessed");
      expect(listing.evidence.every((item) => item.source === "seller_stated" || item.source === "unknown")).toBe(true);
    }
  });

  it("returns deterministic alphabetical results without paid-placement inputs", () => {
    const results = searchEvidenceListings({ query: "AAC" });
    expect(results.map((listing) => listing.id)).toEqual([
      "example-communication-board",
      "example-switch-mount",
    ]);
  });

  it("filters out specialist-review items in lower-risk mode", () => {
    const items = searchEvidenceListings({ lowerRiskOnly: true });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((listing) => listing.safetyGate === "lower_risk_demo")).toBe(true);
  });

  it("shows missing evidence as unknown, never inferred verified", () => {
    const listing = EVIDENCE_DEMO_LISTINGS[0];
    expect(findEvidence(listing, "Warranty").source).toBe("unknown");
    expect(findEvidence(listing, "Not provided").source).toBe("unknown");
  });

  it("blocks specialist-review equipment from the local draft", () => {
    const lamp = EVIDENCE_DEMO_LISTINGS.find((listing) => listing.id === "example-lamp");
    expect(lamp).toBeDefined();
    expect(canAddToLocalDraft(lamp!)).toBe(false);
    expect(makeLocalEnquiryDraft([{ listingId: "example-lamp", quantity: 1 }])).toContain("Invalid");
  });

  it("exports only a local, unsigned draft and no payment instruction", () => {
    const text = makeLocalEnquiryDraft([{ listingId: "example-keyboard", quantity: 1 }]);
    expect(text).toContain("NOT SENT");
    expect(text).toContain("NO ORDER, INVOICE OR PAYMENT");
    expect(text).toContain("No NDIS funding");
  });

  it("rejects tampered quantities, duplicate lines and missing records", () => {
    expect(makeLocalEnquiryDraft([{ listingId: "example-keyboard", quantity: 99 }])).toContain("Invalid");
    expect(makeLocalEnquiryDraft([{ listingId: "unknown", quantity: 1 }])).toContain("Invalid");
    expect(makeLocalEnquiryDraft([
      { listingId: "example-keyboard", quantity: 1 },
      { listingId: "example-keyboard", quantity: 1 },
    ])).toContain("Invalid");
  });
});
