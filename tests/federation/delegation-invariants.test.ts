import { describe, expect, it } from "vitest";

import {
  enforceAuthorityInvariants,
  hasAuthorityCategory,
  inferStatusTransition,
} from "@/lib/delegation/authority";
import {
  isInformalRelationship,
  isLegallyBackedRelationship,
  summariseRelationship,
} from "@/lib/delegation/relationships";

describe("delegation invariants — relationship != authority", () => {
  it("legal_representation without legal_instrument_verified is refused", () => {
    expect(() =>
      enforceAuthorityInvariants(
        ["legal_representation"],
        "self_asserted"
      )
    ).toThrow(/legal_representation/);
  });

  it("legal_representation with legal_instrument_verified is accepted", () => {
    expect(() =>
      enforceAuthorityInvariants(
        ["legal_representation"],
        "legal_instrument_verified"
      )
    ).not.toThrow();
  });

  it("emergency_action refuses self_asserted", () => {
    expect(() =>
      enforceAuthorityInvariants(["emergency_action"], "self_asserted")
    ).toThrow(/emergency_action/);
  });

  it("billing_manage refuses self_asserted", () => {
    expect(() =>
      enforceAuthorityInvariants(["billing_manage"], "self_asserted")
    ).toThrow(/billing_manage/);
  });

  it("view_only with self_asserted is fine", () => {
    expect(() =>
      enforceAuthorityInvariants(["view_only"], "self_asserted")
    ).not.toThrow();
  });
});

describe("delegation status transitions", () => {
  it("allows proposed -> active", () => {
    expect(inferStatusTransition("proposed", "active")).toBe(true);
  });

  it("blocks revoked -> active", () => {
    expect(inferStatusTransition("revoked", "active")).toBe(false);
  });

  it("blocks expired -> active", () => {
    expect(inferStatusTransition("expired", "active")).toBe(false);
  });

  it("allows active -> revoked", () => {
    expect(inferStatusTransition("active", "revoked")).toBe(true);
  });
});

describe("delegation authority category checks", () => {
  it("category check fails when authority not active", () => {
    expect(
      hasAuthorityCategory(
        { authorityCategories: ["billing_manage"], status: "proposed" },
        "billing_manage"
      )
    ).toBe(false);
  });

  it("category check passes when active and category present", () => {
    expect(
      hasAuthorityCategory(
        { authorityCategories: ["billing_manage"], status: "active" },
        "billing_manage"
      )
    ).toBe(true);
  });
});

describe("relationship classification (informal vs legal)", () => {
  it("family_member is informal", () => {
    expect(isInformalRelationship("family_member")).toBe(true);
    expect(isLegallyBackedRelationship("family_member")).toBe(false);
  });

  it("emergency_contact is informal", () => {
    expect(isInformalRelationship("emergency_contact")).toBe(true);
  });

  it("legal_guardian is legally-backed", () => {
    expect(isLegallyBackedRelationship("legal_guardian")).toBe(true);
    expect(isInformalRelationship("legal_guardian")).toBe(false);
  });

  it("family_member summary states it is not an authority", () => {
    expect(summariseRelationship("family_member").toLowerCase()).toContain(
      "not an authority"
    );
  });

  it("emergency_contact summary states contact status is not access", () => {
    expect(
      summariseRelationship("emergency_contact").toLowerCase()
    ).toContain("not access");
  });
});
