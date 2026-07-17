import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertVaultAiToolAllowed,
  isVaultAiProhibited,
  VAULT_AI_PROHIBITED,
} from "@/lib/vault/ai-boundaries";
import {
  assertNotPlainLocalStorage,
  describeOfflineRights,
  resetOfflineDraftsForTests,
} from "@/lib/vault/offline";
import {
  confidentialComputeLabStatus,
  externalProviderLabStatus,
  privateMatchingLabStatus,
} from "@/lib/vault/lab";

describe("Vault feature flag defaults", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("disables personal access vault by default", async () => {
    vi.stubEnv("MAPABLE_PERSONAL_ACCESS_VAULT_ENABLED", undefined);
    vi.stubEnv("MAPABLE_VAULT_ITEM_REGISTRY_ENABLED", undefined);
    const { vaultConfig, isVaultEnforcementActive } = await import(
      "@/lib/vault/config"
    );
    expect(vaultConfig.enabled).toBe(false);
    expect(vaultConfig.itemRegistryEnabled).toBe(false);
    expect(vaultConfig.encryptedStoreEnabled).toBe(false);
    expect(isVaultEnforcementActive("transport")).toBe(false);
  });
});

describe("Vault AI boundaries", () => {
  it("allows explain tools with matching authority context", () => {
    expect(() =>
      assertVaultAiToolAllowed("explainVaultItem", {
        ownerUserId: "user_1",
        permittedTool: "explainVaultItem",
      })
    ).not.toThrow();
  });

  it("rejects capability issuance and classification actions", () => {
    expect(isVaultAiProhibited("issue_capability")).toBe(true);
    expect(isVaultAiProhibited("classify_sensitivity")).toBe(true);
    expect(isVaultAiProhibited("determine_canonical_routing")).toBe(true);
    expect(VAULT_AI_PROHIBITED).toContain("train_on_vault_data");
  });
});

describe("Vault offline rights", () => {
  afterEach(() => {
    resetOfflineDraftsForTests();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("forbids plain localStorage for sensitive content", () => {
    expect(assertNotPlainLocalStorage()).toBe(true);
    expect(describeOfflineRights().storageRule).toMatch(/localStorage/i);
  });

  it("allows drafts but blocks issuance while offline", async () => {
    vi.stubEnv("MAPABLE_PERSONAL_ACCESS_VAULT_ENABLED", "true");
    vi.stubEnv("MAPABLE_VAULT_LOCAL_STORAGE_ENABLED", "true");
    vi.resetModules();
    const offline = await import("@/lib/vault/offline");
    const draft = offline.createOfflineDisclosureDraft({
      ownerUserId: "user_1",
      purposeCode: "access.verify_venue",
      requestedFields: ["arrival_time"],
    });
    expect(draft.status).toBe("draft_local_only");
    expect(draft.issuanceBlockedReason).toMatch(/fresh approval/i);
    expect(offline.describeOfflineRights().prohibited).toContain(
      "issue a new external disclosure"
    );
  });
});

describe("Wave 9 laboratory stubs", () => {
  it("keep private matching and confidential compute out of production path", () => {
    expect(privateMatchingLabStatus().productionPath).toBe(false);
    expect(confidentialComputeLabStatus().productionPath).toBe(false);
    expect(externalProviderLabStatus().productionPath).toBe(false);
  });
});
