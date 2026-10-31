import { afterEach, describe, expect, it, vi } from "vitest";

import {
  decryptProviderSearchPreferences,
  encryptProviderSearchPreferences,
} from "@/lib/crypto/provider-search-preferences";
import {
  PROVIDER_SEARCH_CONSENT_VERSION,
  providerSearchPreferencesSchema,
  saveProviderSearchProfileSchema,
} from "@/lib/provider/finder/search-profile-contract";

afterEach(() => vi.unstubAllEnvs());

describe("encrypted opt-in provider search preferences", () => {
  it("round trips through purpose-bound AES-GCM encryption", () => {
    vi.stubEnv("MAPABLE_DATA_ENCRYPTION_KEY", "unit-test-search-profile-secret-key-material");
    vi.stubEnv("NDIS_ENCRYPTION_KEY", "");
    const profile = providerSearchPreferencesSchema.parse({
      state: "NSW", postcode: "2075",
      serviceTypes: ["daily_life"], communicationModes: ["AAC"],
      delivery: "home_visit", fundingManagement: "self",
    });
    const ciphertext = encryptProviderSearchPreferences(profile);
    expect(ciphertext).not.toContain("AAC");
    expect(ciphertext).not.toContain("2075");
    expect(decryptProviderSearchPreferences(ciphertext)).toEqual(profile);
  });

  it("refuses to decrypt with the wrong encryption key", () => {
    vi.stubEnv("MAPABLE_DATA_ENCRYPTION_KEY", "unit-test-search-profile-secret-key-material");
    vi.stubEnv("NDIS_ENCRYPTION_KEY", "");
    const encrypted = encryptProviderSearchPreferences({ state: "NSW" });
    vi.stubEnv("MAPABLE_DATA_ENCRYPTION_KEY", "different-unit-test-key-material-no-fallback");
    expect(() => decryptProviderSearchPreferences(encrypted)).toThrow();
  });

  it("requires explicit purpose consent before storage", () => {
    const preferences = providerSearchPreferencesSchema.parse({ serviceTypes: ["transport"] });
    expect(saveProviderSearchProfileSchema.safeParse({
      consent: false, consentVersion: PROVIDER_SEARCH_CONSENT_VERSION, preferences,
    }).success).toBe(false);
    expect(saveProviderSearchProfileSchema.safeParse({
      consent: true, consentVersion: PROVIDER_SEARCH_CONSENT_VERSION, preferences,
    }).success).toBe(true);
  });

  it("rejects unexpected clinical or identifying fields", () => {
    expect(providerSearchPreferencesSchema.safeParse({
      serviceTypes: [], diagnosis: "must not store",
    }).success).toBe(false);
    expect(providerSearchPreferencesSchema.safeParse({
      serviceTypes: [], streetAddress: "must not store",
    }).success).toBe(false);
  });
});
