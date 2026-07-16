import { describe, expect, it } from "vitest";

import { getDefaultAdapters } from "@/lib/access-intelligence/adapters";
import {
  checkEntitlement,
  planIncludes,
  resolveAccessIntelligencePlan,
} from "@/lib/access-intelligence/entitlements";
import {
  exportPilotDataset,
  getPilot,
  listPilots,
} from "@/lib/access-intelligence/pilots/demo-pilot";
import {
  getVerifyInventory,
  listVerifyVenues,
} from "@/lib/access-intelligence/verify/inventory";

describe("Access Intelligence entitlements", () => {
  it("community cannot access Venue Operations features", () => {
    expect(planIncludes("community", "verify_incidents")).toBe(false);
    expect(planIncludes("community", "verify_portfolio")).toBe(false);
    const decision = checkEntitlement({
      userId: "u1",
      roles: ["participant"],
      feature: "verify_incidents",
      planOverride: "community",
    });
    expect(decision.allowed).toBe(false);
  });

  it("verify_starter cannot access portfolio analytics", () => {
    expect(planIncludes("verify_starter", "verify_portfolio")).toBe(false);
    expect(planIncludes("verify_starter", "verify_inventory")).toBe(true);
  });

  it("enterprise includes pilot console and export", () => {
    expect(planIncludes("enterprise", "pilot_console")).toBe(true);
    expect(planIncludes("enterprise", "pilot_export")).toBe(true);
  });

  it("platform admin resolves to enterprise", () => {
    expect(
      resolveAccessIntelligencePlan({
        userId: "admin",
        roles: ["mapable_admin"],
      }),
    ).toBe("enterprise");
  });
});

describe("MapAble Verify inventory", () => {
  it("lists fictional Harbour Civic Centre", () => {
    const venues = listVerifyVenues();
    expect(venues.some((v) => v.placeId === "place-harbour-civic")).toBe(true);
    expect(venues.every((v) => v.fictional)).toBe(true);
  });

  it("loads Harbour inventory with stale toilet evidence and main-lift incident", () => {
    const inventory = getVerifyInventory("place-harbour-civic");
    expect(inventory).not.toBeNull();
    expect(inventory!.fictionalNotice.toLowerCase()).toMatch(/fictional|demonstration|demo/);
    expect(inventory!.incidents.some((i) => i.type === "lift_outage")).toBe(true);
    expect(inventory!.staleEvidence.length).toBeGreaterThan(0);
    expect(inventory!.coverage.testedProfileCount).toBeGreaterThanOrEqual(16);
    expect(inventory!.temporaryRoute?.text).toMatch(/Western lift/i);
  });
});

describe("Pilot & Evaluation Console", () => {
  it("lists synthetic pilot with fictional warning", () => {
    const pilots = listPilots();
    expect(pilots.length).toBeGreaterThan(0);
    expect(pilots[0]!.fictionalWarning.toLowerCase()).toMatch(/synthetic|fictional/);
  });

  it("export excludes direct identifiers and passport fields", () => {
    const pilot = getPilot("pilot-harbour-demo-2026");
    expect(pilot).not.toBeNull();
    const exported = exportPilotDataset(pilot!.id);
    expect(exported).not.toBeNull();
    const blob = JSON.stringify(exported);
    expect(blob).not.toMatch(/@/);
    expect(blob.toLowerCase()).not.toContain("passport");
    expect(blob.toLowerCase()).not.toContain("email");
    expect(exported!.journeys.every((j) => typeof j.predictedStatus === "string")).toBe(true);
    expect(exported!.fictionalWarning).toBeTruthy();
  });

  it("journeys preserve predicted and observed separately", () => {
    const pilot = getPilot("pilot-harbour-demo-2026")!;
    const mismatch = pilot.journeys.find((j) => j.predictedStatus !== j.observedStatus);
    expect(mismatch).toBeDefined();
    expect(mismatch!.synthetic).toBe(true);
  });
});

describe("Future adapters", () => {
  it("default adapters are labelled mocks", () => {
    const adapters = getDefaultAdapters();
    expect(adapters.transport.mock).toBe(true);
    expect(adapters.messaging.mock).toBe(true);
    expect(adapters.bms.mock).toBe(true);
    expect(adapters.developerApi.mock).toBe(true);
  });
});
