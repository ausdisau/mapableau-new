import { describe, expect, it } from "vitest";

import {
  ECOSYSTEM_JOURNEYS,
  ECOSYSTEM_SERVICES,
  getEcosystemService,
  getJourneyServiceDetails,
} from "@/lib/ecosystem/service-directory";

describe("MapAble ecosystem service directory", () => {
  it("has unique service and journey identifiers", () => {
    expect(new Set(ECOSYSTEM_SERVICES.map((service) => service.id)).size).toBe(
      ECOSYSTEM_SERVICES.length,
    );
    expect(new Set(ECOSYSTEM_JOURNEYS.map((journey) => journey.id)).size).toBe(
      ECOSYSTEM_JOURNEYS.length,
    );
  });

  it("resolves each journey reference without inferring bookings or actions", () => {
    for (const journey of ECOSYSTEM_JOURNEYS) {
      expect(getJourneyServiceDetails(journey)).toHaveLength(
        journey.serviceIds.length,
      );
      for (const id of journey.serviceIds) {
        expect(getEcosystemService(id).id).toBe(id);
      }
      expect(journey.participantControl.length).toBeGreaterThan(20);
    }
  });

  it("never links to unmerged Day or CripSquare integration routes", () => {
    expect(getEcosystemService("day").href).toBeNull();
    expect(getEcosystemService("cripsquare").href).toBeNull();
    for (const service of ECOSYSTEM_SERVICES) {
      if (service.state === "planned") {
        expect(service.href).toBeNull();
      }
    }
  });

  it("uses the inspected MapAble routes for core discovery", () => {
    expect(getEcosystemService("challenges").href).toBe("/signal");
    expect(getEcosystemService("care").href).toBe("/care");
    expect(getEcosystemService("transport").href).toBe("/transport");
    expect(getEcosystemService("employment").href).toBe("/employment");
    expect(getEcosystemService("marketplace").href).toBe("/marketplace");
    expect(getEcosystemService("providers").href).toBe("/provider-finder");
  });

  it("keeps provider registration separate from individual screening", () => {
    const provider = getEcosystemService("providers");
    const worker = getEcosystemService("worker-screening");
    expect(provider.href).not.toBe(worker.href);
    expect(provider.evidence).toMatch(/never proves individual worker screening/i);
    expect(worker.evidence).toMatch(/no access to a private worker-screening database/i);
  });

  it("labels external links as official sources rather than internal authority", () => {
    for (const service of ECOSYSTEM_SERVICES) {
      if (service.href?.startsWith("http")) {
        expect(service.href).toMatch(
          /^https:\/\/(www\.)?(ndis\.gov\.au|ndiscommission\.gov\.au)\//,
        );
      }
    }
  });
});
