import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/gais/regions/route";

const ENV_KEYS = [
  "MAPABLE_GAIS_ENABLED",
  "MAPABLE_GAIS_PUBLIC_API_ENABLED",
  "MAPABLE_GAIS_REGIONAL_DEMAND_ENABLED",
] as const;

const original = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function enableRegionalDemand() {
  process.env.MAPABLE_GAIS_ENABLED = "true";
  process.env.MAPABLE_GAIS_PUBLIC_API_ENABLED = "true";
  process.env.MAPABLE_GAIS_REGIONAL_DEMAND_ENABLED = "true";
}

describe("GET /api/gais/regions", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = original[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("fails closed when the regional demand flag is off", async () => {
    process.env.MAPABLE_GAIS_ENABLED = "true";
    process.env.MAPABLE_GAIS_PUBLIC_API_ENABLED = "true";

    const response = await GET(
      new NextRequest("http://localhost/api/gais/regions?level=SA3"),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.enabled).toBe(false);
    expect(body.feature).toBe("MAPABLE_GAIS_REGIONAL_DEMAND_ENABLED");
  });

  it("rejects an unsupported region level", async () => {
    enableRegionalDemand();

    const response = await GET(
      new NextRequest("http://localhost/api/gais/regions?level=STATE"),
    );

    expect(response.status).toBe(400);
  });

  it("returns public-safe regional GeoJSON and claim metadata", async () => {
    enableRegionalDemand();

    const response = await GET(
      new NextRequest("http://localhost/api/gais/regions?level=SA3"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.type).toBe("FeatureCollection");
    expect(Array.isArray(body.features)).toBe(true);
    expect(body.features.length).toBeGreaterThan(0);
    expect(body.meta.evidenceScope).toBe("regional_demand_public_context");
    expect(body.meta.internalStrategyScoreExposed).toBe(false);
    expect(body.meta.claimState).toBe("in_development");
  });
});
