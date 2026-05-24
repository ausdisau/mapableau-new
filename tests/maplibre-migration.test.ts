import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { getMapAttributionPlainText } from "@/lib/map/map-attribution";
import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";

describe("MapLibre migration cleanup", () => {
  it("does not import leaflet in application source files", () => {
    const offenders = scanForPattern(/from [\"']leaflet|react-leaflet|leaflet\/dist/);
    expect(offenders).toEqual([]);
  });

  it("exposes configured attribution containing OpenStreetMap by default", () => {
    expect(getMapAttributionPlainText()).toContain("OpenStreetMap");
  });

  it("defines stable provider and sponsored layer ids", () => {
    expect(MAP_SOURCES.providers).toBe("providers-source");
    expect(MAP_LAYERS.sponsoredServicesCircle).toBe("sponsored-services-circle-layer");
    expect(MAP_LAYERS.reviews).toBe("reviews-symbol-layer");
    expect(MAP_LAYERS.pickupPoints).toBe("pickup-points-circle-layer");
  });
});

function scanForPattern(pattern: RegExp): string[] {
  const roots = ["components", "app", "lib"];
  const hits: string[] = [];

  for (const root of roots) {
    walk(join(process.cwd(), root), (file) => {
      if (!/\.(ts|tsx)$/.test(file)) return;
      const content = readFileSync(file, "utf8");
      if (pattern.test(content)) hits.push(file);
    });
  }

  return hits;
}

function walk(dir: string, visit: (file: string) => void) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") walk(full, visit);
    if (entry.isFile()) visit(full);
  }
}
