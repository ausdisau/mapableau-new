import { describe, expect, it } from "vitest";

import { isHighRiskMethod } from "@/lib/wallet/recovery";

describe("wallet recovery risk classification", () => {
  it("operator_assisted is high-risk", () => {
    expect(isHighRiskMethod("operator_assisted")).toBe(true);
  });

  it("guardian_shard is high-risk", () => {
    expect(isHighRiskMethod("guardian_shard")).toBe(true);
  });

  it("offline_paper_kit is high-risk", () => {
    expect(isHighRiskMethod("offline_paper_kit")).toBe(true);
  });

  it("passkey_backup is not high-risk", () => {
    expect(isHighRiskMethod("passkey_backup" as never)).toBe(false);
  });

  it("device_re_enrolment is not high-risk", () => {
    expect(isHighRiskMethod("device_re_enrolment" as never)).toBe(false);
  });
});
