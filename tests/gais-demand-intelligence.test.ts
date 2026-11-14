import { afterEach, describe, expect, it } from "vitest";

import {
  DEMAND_PARTICIPANT_DISCLAIMER,
  DEMAND_PARTICIPANT_LAYER_LABEL,
  classifyDemandContext,
  calculateDemandStrategyIndex,
} from "@/lib/gais/demand/metrics";
import {
  buildLatestNdiaSa3Metrics,
  parseNdiaSa3Csv,
} from "@/lib/gais/demand/ndia-sa3";
import {
  buildAbsSa3QueryUrl,
  extractSa3Code,
} from "@/lib/gais/demand/abs-sa3";
import { joinDemandRegionsToGeometry } from "@/lib/gais/demand/geojson";
import {
  DEFAULT_ABS_SA3_URL,
  DEFAULT_NDIA_SA3_URL,
  loadDemandRegionsInBounds,
} from "@/lib/gais/demand/service";
import {
  mapableGaisDemandFlags,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import { isClientGaisDemandLayerEnabled } from "@/lib/gais/client/flags";

const ENV_KEYS = [
  "MAPABLE_GAIS_ENABLED",
  "MAPABLE_GAIS_DEMAND_ENABLED",
  "MAPABLE_GAIS_DEMAND_PUBLIC_API_ENABLED",
  "MAPABLE_GAIS_DEMAND_NDIA_SA3_URL",
  "MAPABLE_GAIS_DEMAND_ABS_SA3_URL",
] as const;

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("GAIS demand metrics", () => {
  it("keeps the strategy index bounded and deterministic", () => {
    expect(calculateDemandStrategyIndex(7500, 20)).toBe(100);
    expect(calculateDemandStrategyIndex(15000, 50)).toBe(100);
    expect(calculateDemandStrategyIndex(0, -50)).toBe(0);
    expect(calculateDemandStrategyIndex(3750, null)).toBe(50);
    expect(calculateDemandStrategyIndex(null, 10)).toBeNull();
  });

  it("uses neutral participant-facing context labels", () => {
    expect(classifyDemandContext(900, 0)).toBe("smaller");
    expect(classifyDemandContext(3200, 2)).toBe("established");
    expect(classifyDemandContext(7600, 2)).toBe("large");
    expect(classifyDemandContext(7600, 8)).toBe("large_and_growing");
  });

  it("does not frame regional data as individual need, availability or eligibility", () => {
    expect(DEMAND_PARTICIPANT_LAYER_LABEL).toBe("Regional support context");
    expect(DEMAND_PARTICIPANT_DISCLAIMER).toBe(
      "Regional context only. It does not measure your individual needs, service availability or eligibility.",
    );
    expect(DEMAND_PARTICIPANT_LAYER_LABEL.toLowerCase()).not.toMatch(
      /score|need|eligib|recommend|available/,
    );
  });
});

describe("NDIA SA3 participant adapter", () => {
  const csv = [
    "RprtDt,StateCd,SA3Cd2016,SA3Nm2016,PrtcpntCnt",
    "30JUN2025,NSW,10102,Queanbeyan,1500",
    "30JUN2026,NSW,10102,Queanbeyan,1694",
    "30JUN2025,ACT,80103,Canberra East,<11",
    "30JUN2026,ACT,80103,Canberra East,75",
    '30JUN2026,NSW,99999,"Quoted, Region",120',
  ].join("\n");

  it("parses quoted CSV cells and preserves suppressed counts as unknown", () => {
    const rows = parseNdiaSa3Csv(csv);
    expect(rows).toHaveLength(5);
    expect(rows.find((row) => row.regionCode === "99999")?.regionName).toBe(
      "Quoted, Region",
    );
    const suppressed = rows.find(
      (row) => row.regionCode === "80103" && row.reportDate === "2025-06-30",
    );
    expect(suppressed?.participantCount).toBeNull();
    expect(suppressed?.suppressed).toBe(true);
  });

  it("selects latest and prior-year observations and calculates growth only from known counts", () => {
    const metrics = buildLatestNdiaSa3Metrics(parseNdiaSa3Csv(csv));
    const queanbeyan = metrics.get("10102");
    expect(queanbeyan?.observedAt).toBe("2026-06-30");
    expect(queanbeyan?.participantCount).toBe(1694);
    expect(queanbeyan?.previousYearParticipantCount).toBe(1500);
    expect(queanbeyan?.yoyGrowthPercent).toBeCloseTo(12.9333, 3);

    const canberraEast = metrics.get("80103");
    expect(canberraEast?.participantCount).toBe(75);
    expect(canberraEast?.previousYearParticipantCount).toBeNull();
    expect(canberraEast?.yoyGrowthPercent).toBeNull();
  });
});

describe("ABS SA3 geometry adapter", () => {
  it("builds a bounded ASGS 2016 GeoJSON query", () => {
    const url = new URL(
      buildAbsSa3QueryUrl(
        { minLat: -34, minLng: 150, maxLat: -33, maxLng: 151 },
        "https://example.test/MapServer/0/query",
      ),
    );
    expect(url.searchParams.get("geometryType")).toBe("esriGeometryEnvelope");
    expect(url.searchParams.get("spatialRel")).toBe("esriSpatialRelIntersects");
    expect(url.searchParams.get("outSR")).toBe("4326");
    expect(url.searchParams.get("f")).toBe("geojson");
    expect(url.searchParams.get("geometry")).toContain("150");
  });

  it("accepts common SA3 2016 property aliases", () => {
    expect(extractSa3Code({ SA3_CODE_2016: "10102" })).toBe("10102");
    expect(extractSa3Code({ sa3_code_2016: "10103" })).toBe("10103");
    expect(extractSa3Code({ SA3_CODE16: "10104" })).toBe("10104");
    expect(extractSa3Code({ sa3_code16: "10105" })).toBe("10105");
  });

  it("joins demand metrics to Polygon and MultiPolygon geometry by SA3 code", () => {
    const metrics = buildLatestNdiaSa3Metrics(
      parseNdiaSa3Csv(
        [
          "RprtDt,StateCd,SA3Cd2016,SA3Nm2016,PrtcpntCnt",
          "30JUN2025,NSW,10102,Queanbeyan,1500",
          "30JUN2026,NSW,10102,Queanbeyan,1694",
          "30JUN2026,NSW,10103,Snowy Mountains,425",
        ].join("\n"),
      ),
    );
    const collection = joinDemandRegionsToGeometry(
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "poly",
            properties: { SA3_CODE_2016: "10102" },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [150, -34],
                  [151, -34],
                  [151, -33],
                  [150, -34],
                ],
              ],
            },
          },
          {
            type: "Feature",
            id: "multi",
            properties: { SA3_CODE_2016: "10103" },
            geometry: { type: "MultiPolygon", coordinates: [] },
          },
        ],
      },
      metrics,
    );
    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.geometry.type).toBe("Polygon");
    expect(collection.features[1]?.geometry.type).toBe("MultiPolygon");
    expect(collection.features[0]?.properties.regionCode).toBe("10102");
    expect(collection.features[0]?.properties.strategyIndex).toBeTypeOf("number");
    expect(collection.features[0]?.properties.strategyClaimState).toBe("exploratory");
  });
});

describe("GAIS demand flags and source service", () => {
  it("fails closed until master and both server demand flags are enabled", () => {
    expect(mapableGaisFlags.enabled).toBe(false);
    expect(mapableGaisDemandFlags.readEnabled).toBe(false);

    process.env.MAPABLE_GAIS_ENABLED = "true";
    process.env.MAPABLE_GAIS_DEMAND_ENABLED = "true";
    expect(mapableGaisDemandFlags.readEnabled).toBe(false);

    process.env.MAPABLE_GAIS_DEMAND_PUBLIC_API_ENABLED = "true";
    expect(mapableGaisDemandFlags.readEnabled).toBe(true);
  });

  it("uses official defaults but permits environment URL overrides", () => {
    expect(DEFAULT_NDIA_SA3_URL).toContain("dataresearch.ndis.gov.au");
    expect(DEFAULT_ABS_SA3_URL).toContain("geo.abs.gov.au");
  });

  it("joins fetched official source data without participant-identifying input", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("ndis")) {
        return new Response(
          [
            "RprtDt,StateCd,SA3Cd2016,SA3Nm2016,PrtcpntCnt",
            "30JUN2025,NSW,10102,Queanbeyan,1500",
            "30JUN2026,NSW,10102,Queanbeyan,1694",
          ].join("\n"),
          { status: 200 },
        );
      }
      return Response.json({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { SA3_CODE_2016: "10102" },
            geometry: { type: "Polygon", coordinates: [] },
          },
        ],
      });
    };

    const result = await loadDemandRegionsInBounds(
      { minLat: -36, minLng: 148, maxLat: -33, maxLng: 151 },
      { fetchImpl, now: () => new Date("2026-09-18T00:00:00Z") },
    );
    expect(result.type).toBe("FeatureCollection");
    expect(result.features[0]?.properties.participantCount).toBe(1694);
    expect(result.meta.claimState).toBe("in_development");
    expect(result.meta.strategyClaimState).toBe("exploratory");
    expect(result.meta.sources.ndia).toContain("dataresearch.ndis.gov.au");
    expect(result.meta.sources.abs).toContain("geo.abs.gov.au");
    expect(JSON.stringify(result)).not.toMatch(/participantId|userId|planBudget/i);
  });
});

describe("GAIS demand client flag", () => {
  it("requires both GAIS and demand layer public flags", () => {
    expect(isClientGaisDemandLayerEnabled({})).toBe(false);
    expect(
      isClientGaisDemandLayerEnabled({
        NEXT_PUBLIC_MAPABLE_GAIS_ENABLED: "true",
        NEXT_PUBLIC_MAPABLE_GAIS_DEMAND_LAYER: "true",
      }),
    ).toBe(true);
  });
});
