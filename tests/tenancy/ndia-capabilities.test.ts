import { describe, expect, it } from "vitest";

import {
  invokeNdiaCapability,
  listNdiaCapabilityDenials,
  NDIA_CAPABILITIES,
  NDIA_DENIAL_CODE,
} from "@/lib/tenancy/tenant-ndia-capabilities";

describe("NDIA capability contract", () => {
  it("denies every protected capability", () => {
    for (const capability of NDIA_CAPABILITIES) {
      const result = invokeNdiaCapability(capability);
      expect(result.authorised).toBe(false);
      expect(result.code).toBe(NDIA_DENIAL_CODE);
    }
    expect(listNdiaCapabilityDenials()).toHaveLength(NDIA_CAPABILITIES.length);
  });
});
