import { afterEach, describe, expect, it } from "vitest";

import {
  getDerivedState,
  ingestObservation,
  resetSensorStore,
  assertSensorThingsReadOnly,
} from "@/lib/aura/interoperability/sensorthings";

afterEach(() => resetSensorStore());

describe("Wave 7 — SensorThings read-only", () => {
  it("good reading updates derived state", () => {
    assertSensorThingsReadOnly();
    const obs = ingestObservation({
      sourceId: "st-fixture",
      thingId: "lift-west",
      placeId: "place-harbour-civic",
      elementId: "hcc-lift-west",
      observedProperty: "lift.operation",
      value: true,
      phenomenonTime: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      quality: "good",
      sequenceNumber: 1,
      staleAfter: new Date(Date.now() + 60000).toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      sourceVersion: "1",
      trustedSource: true,
    });
    expect(obs).toBeTruthy();
    const derived = getDerivedState(
      "place-harbour-civic",
      "hcc-lift-west",
      "lift.operation",
    );
    expect(derived?.value).toBe(true);
  });

  it("invalid reading rejected", () => {
    const obs = ingestObservation({
      sourceId: "st-fixture",
      thingId: "lift-west",
      placeId: "place-harbour-civic",
      observedProperty: "lift.operation",
      value: false,
      phenomenonTime: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      quality: "invalid",
      staleAfter: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      sourceVersion: "1",
      trustedSource: true,
    });
    expect(obs).toBeNull();
  });

  it("older sequence does not replace newer", () => {
    ingestObservation({
      sourceId: "st-fixture",
      thingId: "lift-west",
      placeId: "place-harbour-civic",
      elementId: "hcc-lift-west",
      observedProperty: "lift.operation",
      value: true,
      phenomenonTime: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      quality: "good",
      sequenceNumber: 5,
      staleAfter: new Date(Date.now() + 60000).toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      sourceVersion: "1",
      trustedSource: true,
    });
    const older = ingestObservation({
      sourceId: "st-fixture",
      thingId: "lift-west",
      placeId: "place-harbour-civic",
      elementId: "hcc-lift-west",
      observedProperty: "lift.operation",
      value: false,
      phenomenonTime: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      quality: "good",
      sequenceNumber: 3,
      staleAfter: new Date(Date.now() + 60000).toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      sourceVersion: "1",
      trustedSource: true,
    });
    expect(older).toBeNull();
  });

  it("forged source rejected", () => {
    expect(() =>
      ingestObservation({
        sourceId: "forged",
        thingId: "x",
        placeId: "p",
        observedProperty: "lift.operation",
        value: false,
        phenomenonTime: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        quality: "good",
        staleAfter: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        sourceVersion: "1",
        trustedSource: false,
      }),
    ).toThrow("AURA_OBSERVATION_SOURCE_FORGED");
  });
});
