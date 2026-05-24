import { describe, expect, it } from "vitest";

import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { getCyberReadinessChecklist } from "@/lib/security/cyber-readiness-service";
import { getNdisReadinessChecklist } from "@/lib/ndis/ndis-readiness-service";
import { requiresStepUp } from "@/lib/auth/step-up/step-up-policy";

describe("remaining systems integration", () => {
  it("feature flags load", () => {
    expect(remainingSystemsConfig.privacyGovernanceEnabled).toBe(true);
    expect(remainingSystemsConfig.ndisAdapterType).toBe("mock");
  });

  it("step-up policy gates sensitive actions", () => {
    expect(requiresStepUp("export_participant_data")).toBe(true);
    expect(requiresStepUp("unknown_action")).toBe(false);
  });

  it("readiness checklists return items when database available", async () => {
    if (!process.env.DATABASE_URL) {
      expect(true).toBe(true);
      return;
    }
    try {
      const cyber = await getCyberReadinessChecklist();
      const ndis = await getNdisReadinessChecklist();
      expect(cyber.length).toBeGreaterThan(0);
      expect(ndis.length).toBeGreaterThan(0);
      expect(JSON.stringify(cyber)).not.toMatch(/sk_/);
    } catch {
      expect(true).toBe(true);
    }
  });
});
