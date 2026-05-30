import { describe, expect, it } from "vitest";

import {
  mapableStatusClassForKey,
  mapableStatusToneForKey,
} from "@/lib/brand/status-styles";

describe("mapable status styles", () => {
  it("maps billing and care statuses to semantic tones", () => {
    expect(mapableStatusToneForKey("paid")).toBe("success");
    expect(mapableStatusToneForKey("pending_payment")).toBe("warning");
    expect(mapableStatusToneForKey("failed")).toBe("danger");
    expect(mapableStatusToneForKey("confirmed")).toBe("success");
  });

  it("falls back to neutral styling for unknown statuses", () => {
    expect(mapableStatusToneForKey("custom_status")).toBe("neutral");
    expect(mapableStatusClassForKey("custom_status")).toContain("muted");
  });

  it("maps transport lifecycle statuses", () => {
    expect(mapableStatusToneForKey("trip_completed")).toBe("success");
    expect(mapableStatusToneForKey("provider_review")).toBe("warning");
    expect(mapableStatusToneForKey("declined")).toBe("danger");
  });
});
