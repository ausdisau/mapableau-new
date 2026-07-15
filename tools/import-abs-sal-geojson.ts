import fs from "node:fs";
import path from "node:path";

// Usage:
// npx tsx tools/import-abs-sal-geojson.ts data/raw/sal.geojson data/generated/suburb-access-guides.generated.json
//
// This script expects a GeoJSON FeatureCollection with suburb/locality properties.
// Adapt property names to match the official file used by your project.

type Feature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type?: string; coordinates?: unknown } | null;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getString(properties: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = properties[name];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function centroidFromGeometry(geometry: {
  coordinates?: unknown;
}): { lat: number; lng: number } {
  const points: Array<[number, number]> = [];

  function walk(coords: unknown) {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      points.push([coords[0], coords[1]]);
      return;
    }
    coords.forEach(walk);
  }

  walk(geometry?.coordinates);

  if (points.length === 0) return { lat: 0, lng: 0 };

  const sum = points.reduce(
    (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: Number((sum.lat / points.length).toFixed(6)),
    lng: Number((sum.lng / points.length).toFixed(6)),
  };
}

const inputPath = process.argv[2] || "data/raw/sal.geojson";
const outputPath = process.argv[3] || "data/generated/suburb-access-guides.generated.json";

const absoluteInput = path.resolve(inputPath);
const absoluteOutput = path.resolve(outputPath);

if (!fs.existsSync(absoluteInput)) {
  throw new Error(`Input file not found: ${absoluteInput}`);
}

const geojson = JSON.parse(fs.readFileSync(absoluteInput, "utf8")) as FeatureCollection;

const guides = geojson.features.map((feature) => {
  const properties = feature.properties || {};
  const name = getString(properties, ["SAL_NAME21", "SAL_NAME", "suburb", "name", "NAME"]);
  const salCode = getString(properties, ["SAL_CODE21", "SAL_CODE", "code", "id", "CODE"]);
  const state = getString(properties, ["STE_NAME21", "STATE", "state", "STE_CODE21"]);
  const stateAbbr = state.length <= 3 ? state.toUpperCase() : state.slice(0, 3).toUpperCase();
  const centroid = centroidFromGeometry(feature.geometry ?? {});
  const slug = slugify(name || salCode);

  return {
    id: `${stateAbbr.toLowerCase()}-${slug}`,
    salCode,
    slug,
    name,
    state: stateAbbr,
    lgaNames: [],
    centroid,
    guideStatus: "draft",
    accessSummary: `${name} is a draft MapAble suburb access guide. Local verification is needed for transport, toilets, parking, step-free movement, quiet spaces and accessible venues.`,
    confidenceScore: 10,
    accessThemes: ["transport", "toilets", "parking", "step-free", "sensory"],
    transportNotes: [],
    toiletNotes: [],
    parkingDropoffNotes: [],
    stepFreeRouteNotes: [],
    sensoryNotes: [],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: [],
    nearbyGuides: [],
    dataSources: [{ label: "Official suburb/locality boundary import", sourceType: "official-boundary" }],
    lastUpdated: new Date().toISOString().slice(0, 10),
  };
});

fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
fs.writeFileSync(absoluteOutput, JSON.stringify(guides, null, 2));
console.log(`Wrote ${guides.length} suburb guide records to ${absoluteOutput}`);
