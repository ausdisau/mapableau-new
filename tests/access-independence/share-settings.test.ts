import { describe, expect, it } from "vitest";

import {
  accessShareSettingsPatchSchema,
  isSharingActive,
  parseAccessShareSettings,
  shareSettingsMateriallyEqual,
} from "@/lib/access-passport/share-settings";

describe("access share settings", () => {
  it("rejects unknown fields and free-text recipient authority on patch", () => {
    const result = accessShareSettingsPatchSchema.safeParse({
      categories: ["mobility"],
      recipientOrganisationId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
      recipientLabel: "should-not-be-client-authority",
      purpose: "Prepare for my appointment",
      expiresAt: null,
      active: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires a verified organisation id for active sharing", () => {
    const settings = parseAccessShareSettings({
      version: 1,
      categories: ["mobility"],
      recipientOrganisationId: null,
      recipientLabel: "Acme Care",
      purpose: "Visit support",
      expiresAt: null,
      active: true,
      updatedAt: new Date().toISOString(),
    });
    expect(isSharingActive(settings)).toBe(false);
  });

  it("treats expired consent as inactive", () => {
    const settings = parseAccessShareSettings({
      version: 1,
      categories: ["mobility"],
      recipientOrganisationId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
      recipientLabel: "Acme Care",
      purpose: "Visit support",
      expiresAt: "2020-01-01T00:00:00.000Z",
      active: true,
      updatedAt: "2020-01-01T00:00:00.000Z",
    });
    expect(isSharingActive(settings)).toBe(false);
  });

  it("does not treat legacy boolean maps as active sharing", () => {
    const settings = parseAccessShareSettings({ orgA: true, orgB: false });
    expect(settings.active).toBe(false);
    expect(settings.categories).toEqual([]);
    expect(isSharingActive(settings)).toBe(false);
  });

  it("recognises active non-expired org-bound sharing", () => {
    const settings = parseAccessShareSettings({
      version: 1,
      categories: ["communication", "assistance_animal"],
      recipientOrganisationId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
      recipientLabel: "City Clinic",
      purpose: "Accessible appointment planning",
      expiresAt: null,
      active: true,
      updatedAt: new Date().toISOString(),
    });
    expect(isSharingActive(settings)).toBe(true);
  });

  it("detects material equality to avoid duplicate active grants", () => {
    const current = parseAccessShareSettings({
      version: 1,
      categories: ["mobility", "sensory"],
      recipientOrganisationId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
      recipientLabel: "Clinic",
      purpose: "Visit",
      expiresAt: null,
      active: true,
      updatedAt: new Date().toISOString(),
      consentRecordId: "consent-1",
    });
    expect(
      shareSettingsMateriallyEqual(current, {
        categories: ["sensory", "mobility"],
        recipientOrganisationId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
        purpose: "Visit",
        expiresAt: null,
        active: true,
      }),
    ).toBe(true);
    expect(
      shareSettingsMateriallyEqual(current, {
        categories: ["mobility"],
        recipientOrganisationId: "clxxxxxxxxxxxxxxxxxxxxxxxx",
        purpose: "Visit",
        expiresAt: null,
        active: true,
      }),
    ).toBe(false);
  });
});
