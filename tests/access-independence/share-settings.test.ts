import { describe, expect, it } from "vitest";

import {
  accessShareSettingsPatchSchema,
  isSharingActive,
  parseAccessShareSettings,
} from "@/lib/access-passport/share-settings";

describe("access share settings", () => {
  it("rejects unknown fields on patch payloads", () => {
    const result = accessShareSettingsPatchSchema.safeParse({
      categories: ["mobility"],
      recipientLabel: "Acme Care",
      purpose: "Prepare for my appointment",
      expiresAt: null,
      active: true,
      diagnosis: "should-not-be-allowed",
    });
    expect(result.success).toBe(false);
  });

  it("treats expired consent as inactive", () => {
    const settings = parseAccessShareSettings({
      version: 1,
      categories: ["mobility"],
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

  it("recognises active non-expired sharing", () => {
    const settings = parseAccessShareSettings({
      version: 1,
      categories: ["communication", "assistance_animal"],
      recipientLabel: "City Clinic",
      purpose: "Accessible appointment planning",
      expiresAt: null,
      active: true,
      updatedAt: new Date().toISOString(),
    });
    expect(isSharingActive(settings)).toBe(true);
  });
});
