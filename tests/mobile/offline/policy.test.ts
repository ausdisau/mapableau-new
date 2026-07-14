
import { describe, expect, it } from "vitest";
import {
  mayCacheOffline,
  offlineDoesNotGrantAuthority,
} from "../../../apps/mobile/src/offline/policy";

describe("offline policy", () => {
  it("allows only approved data classes", () => {
    expect(mayCacheOffline("today_schedule_minimal")).toBe(true);
    expect(mayCacheOffline("full_clinical_history")).toBe(false);
    expect(mayCacheOffline("full_ndis_plan")).toBe(false);
    expect(mayCacheOffline("admin_data")).toBe(false);
  });

  it("states offline is not authority", () => {
    expect(offlineDoesNotGrantAuthority()).toBe(true);
  });
});
