import { describe, expect, it } from "vitest";

import {
  DATA_CLASS_TO_SENSITIVITY,
  UNKNOWN_SENSITIVITY,
  compareSensitivity,
  failUpward,
  maxSensitivity,
  sensitivityForDataClass,
} from "@/lib/ai/platform/guardian/processing-sensitivity";
import { DATA_CLASSES } from "@/lib/ai/platform/types/classification";

describe("Guardian processing sensitivity", () => {
  it("maps every canonical DataClass explicitly", () => {
    expect(DATA_CLASS_TO_SENSITIVITY.public).toBe("D0_PUBLIC");
    expect(DATA_CLASS_TO_SENSITIVITY.operational).toBe("D1_INTERNAL");
    expect(DATA_CLASS_TO_SENSITIVITY.participant_pii).toBe("D2_PERSONAL");
    expect(DATA_CLASS_TO_SENSITIVITY.health_sensitive).toBe("D3_SENSITIVE");
    expect(DATA_CLASS_TO_SENSITIVITY.safeguarding).toBe("D3_SENSITIVE");
    expect(DATA_CLASS_TO_SENSITIVITY.financial).toBe("D4_RESTRICTED");
    expect(DATA_CLASS_TO_SENSITIVITY.credentials_secrets).toBe("D4_RESTRICTED");
    expect(DATA_CLASS_TO_SENSITIVITY.legal_privileged).toBe("D4_RESTRICTED");

    for (const dc of DATA_CLASSES) {
      expect(DATA_CLASS_TO_SENSITIVITY[dc]).toBeTruthy();
    }
  });

  it("fails unknown classes upward to D4_RESTRICTED", () => {
    expect(sensitivityForDataClass("not_a_real_class")).toBe(
      UNKNOWN_SENSITIVITY
    );
    expect(UNKNOWN_SENSITIVITY).toBe("D4_RESTRICTED");
  });

  it("takes the maximum sensitivity across a payload", () => {
    expect(maxSensitivity(["public", "participant_pii"])).toBe("D2_PERSONAL");
    expect(maxSensitivity(["participant_pii", "safeguarding"])).toBe(
      "D3_SENSITIVE"
    );
    expect(maxSensitivity(["health_sensitive", "financial"])).toBe(
      "D4_RESTRICTED"
    );
    expect(maxSensitivity([])).toBe("D4_RESTRICTED");
  });

  it("never automatically downgrades via failUpward", () => {
    expect(failUpward("D3_SENSITIVE", "D1_INTERNAL")).toBe("D3_SENSITIVE");
    expect(failUpward("D1_INTERNAL", "D3_SENSITIVE")).toBe("D3_SENSITIVE");
    expect(compareSensitivity("D4_RESTRICTED", "D0_PUBLIC")).toBeGreaterThan(0);
  });
});
