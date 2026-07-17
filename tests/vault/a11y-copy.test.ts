import { describe, expect, it } from "vitest";

import {
  VAULT_DELETION_DISCLAIMER,
  VAULT_ESSENTIAL_SERVICES_NOTE,
  VAULT_NON_E2E_DISCLAIMER,
} from "@/lib/vault/config";

describe("Vault accessibility and honesty copy", () => {
  it("keeps essential services available without Vault", () => {
    expect(VAULT_ESSENTIAL_SERVICES_NOTE).toMatch(/without/i);
  });

  it("does not claim end-to-end encryption for custodial storage", () => {
    expect(VAULT_NON_E2E_DISCLAIMER).toMatch(/not end-to-end/i);
  });

  it("states honest deletion limits", () => {
    expect(VAULT_DELETION_DISCLAIMER).toMatch(/not independent proof/i);
  });
});
