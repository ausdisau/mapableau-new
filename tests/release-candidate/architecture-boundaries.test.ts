import { describe, expect, it } from "vitest";

import {
  AUTHORITY_BOUNDARIES,
  getAuthorityBoundary,
} from "@/lib/release-candidate/context/authority-boundary";
import {
  DEPRECATED_PATHWAYS,
  RELEASE_CANDIDATE_ALLOWLIST_VIOLATIONS,
  assertNotDeprecatedPathway,
} from "@/lib/release-candidate/context/deprecated-pathways";
import { TENANT_CONTEXT_BOUNDARY_NOTES } from "@/lib/release-candidate/context/tenant-context";

describe("RC1 architecture boundaries", () => {
  it("keeps deprecated pathways out of allowlist violations", () => {
    const deprecatedNames = new Set(
      DEPRECATED_PATHWAYS.map((pathway) => pathway.name),
    );
    const violations = RELEASE_CANDIDATE_ALLOWLIST_VIOLATIONS.filter((name) =>
      deprecatedNames.has(name),
    );
    expect(violations).toEqual([]);
  });

  it("throws when a deprecated pathway is asserted as active", () => {
    expect(() =>
      assertNotDeprecatedPathway("multi-tenant-admin-tenant-context"),
    ).toThrow(/DEPRECATED_PATHWAY/);
    expect(() =>
      assertNotDeprecatedPathway("lib/tenancy/context/tenant-context.ts"),
    ).not.toThrow();
  });

  it("documents consent, delegation, and AURA authority boundaries", () => {
    expect(
      AUTHORITY_BOUNDARIES.map((boundary) => boundary.domain).sort(),
    ).toEqual(["aura", "consent", "delegation"]);
    expect(getAuthorityBoundary("delegation").authoritativeModules).toContain(
      "@/lib/delegation/authority",
    );
  });

  it("retains tenant boundary notes from the authoritative tenancy module", () => {
    expect(TENANT_CONTEXT_BOUNDARY_NOTES).toContain(
      "A null organisationId is not an all-tenant scope.",
    );
  });
});
