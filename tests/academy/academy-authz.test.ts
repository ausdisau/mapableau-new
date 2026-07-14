import { describe, expect, it } from "vitest";

import {
  CAPABILITY_LEVEL_DISCLAIMER,
  COMPLETION_CERTIFICATE_LABEL,
  COMPLIANCE_SUPPORT_DISCLAIMER,
  getAcademyConfig,
} from "@/lib/academy/config";
import { shouldRunAuthMiddleware } from "@/lib/mapable-peers/peer-middleware";
import { hasPermission } from "@/lib/auth/permissions";

describe("MapAble Academy config & language", () => {
  it("issues Certificate of Completion wording only", () => {
    expect(COMPLETION_CERTIFICATE_LABEL).toBe("Certificate of Completion");
    expect(COMPLIANCE_SUPPORT_DISCLAIMER.toLowerCase()).toContain("do not guarantee");
    expect(CAPABILITY_LEVEL_DISCLAIMER).toMatch(/not Australian Qualifications Framework/i);
  });

  it("loads academy config defaults", () => {
    const config = getAcademyConfig();
    expect(config.enabled).toBe(true);
    expect(config.issuerName).toBe("MapAble Academy");
  });
});

describe("Academy permission matrix", () => {
  it("grants learn to support workers and provider admins", () => {
    expect(hasPermission("support_worker", "academy:learn")).toBe(true);
    expect(hasPermission("provider_admin", "academy:provider:admin")).toBe(true);
    expect(hasPermission("mapable_admin", "academy:admin")).toBe(true);
  });

  it("denies studio publish to participants", () => {
    expect(hasPermission("participant", "academy:studio:publish")).toBe(false);
    expect(hasPermission("participant", "academy:learn")).toBe(true);
  });
});

describe("Academy middleware auth gating", () => {
  it("protects learner and studio routes", () => {
    expect(shouldRunAuthMiddleware("/academy/learn")).toBe(true);
    expect(shouldRunAuthMiddleware("/academy/learn/abc")).toBe(true);
    expect(shouldRunAuthMiddleware("/academy/studio/courses")).toBe(true);
    expect(shouldRunAuthMiddleware("/academy/provider/reports")).toBe(true);
  });

  it("keeps public catalogue and verify anonymous", () => {
    expect(shouldRunAuthMiddleware("/academy")).toBe(false);
    expect(shouldRunAuthMiddleware("/academy/catalogue")).toBe(false);
    expect(shouldRunAuthMiddleware("/academy/courses/mapable-worker-foundations")).toBe(
      false,
    );
    expect(shouldRunAuthMiddleware("/academy/credentials/verify/pub123")).toBe(false);
  });
});
