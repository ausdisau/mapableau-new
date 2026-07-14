
import { describe, expect, it } from "vitest";
import { privacySafePushPreview } from "../../../apps/mobile/src/notifications/privacy";

describe("notification privacy", () => {
  it("uses safe lock-screen preview", () => {
    const preview = privacySafePushPreview("mission_update");
    expect(preview).toBe("MapAble needs your review.");
    expect(preview.toLowerCase()).not.toContain("bowel");
  });
});
