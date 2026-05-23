import { describe, expect, it } from "vitest";

import {
  assertNoPiiInOrsPayload,
  buildOrsRoutingPayload,
  roundCoordinate,
} from "@/lib/geo/privacy-boundary";

describe("privacy-boundary", () => {
  it("rounds coordinates", () => {
    expect(roundCoordinate(-33.86881945)).toBe(-33.86882);
  });

  it("builds ORS payload without address fields", () => {
    const payload = buildOrsRoutingPayload([
      { lat: -33.87, lng: 151.21 },
      { lat: -33.88, lng: 151.22 },
    ]);
    expect(payload.coordinates).toHaveLength(2);
    assertNoPiiInOrsPayload(payload);
  });

  it("rejects PII keys in ORS payload", () => {
    expect(() =>
      assertNoPiiInOrsPayload({ homeAddress: "123 Secret St" })
    ).toThrow(/PII_FIELD_IN_ORS_PAYLOAD/);
  });
});
