import { NextResponse } from "next/server";

import {
  ABS_GCCSA_2026_REFERENCE_URL,
  ABS_GCCSA_2026_SERVICE_URL,
  normalizeAbsGccsaGeoJson,
  type GccsaBoundaryApiResponse,
} from "@/lib/access/regions/gccsa";

type ArcGisServiceMetadata = {
  layers?: Array<{ id?: number; name?: string }>;
};

async function resolveGeneralisedLayerId(serviceUrl: string): Promise<number> {
  try {
    const response = await fetch(serviceUrl + "?f=json", {
      next: { revalidate: 86400 },
    });
    if (!response.ok) return 1;

    const metadata = (await response.json()) as ArcGisServiceMetadata;
    const layers = metadata.layers ?? [];
    const generalised = layers.find((layer) =>
      (layer.name ?? "").toUpperCase().includes("_GEN"),
    );
    if (typeof generalised?.id === "number") return generalised.id;

    const full = layers.find(
      (layer) => (layer.name ?? "").toUpperCase() === "GCCSA",
    );
    return typeof full?.id === "number" ? full.id : 1;
  } catch {
    return 1;
  }
}

export async function GET() {
  const serviceUrl =
    process.env.ABS_GCCSA_2026_SERVICE_URL ?? ABS_GCCSA_2026_SERVICE_URL;
  const layerId = await resolveGeneralisedLayerId(serviceUrl);

  const queryUrl = new URL(serviceUrl + "/" + layerId + "/query");
  queryUrl.searchParams.set("where", "1=1");
  queryUrl.searchParams.set("outFields", "*");
  queryUrl.searchParams.set("returnGeometry", "true");
  queryUrl.searchParams.set("outSR", "4326");
  queryUrl.searchParams.set("f", "geojson");

  try {
    const response = await fetch(queryUrl, {
      next: { revalidate: 86400 },
      headers: {
        Accept: "application/geo+json, application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "ABS GCCSA boundary service is temporarily unavailable",
          source: serviceUrl,
        },
        { status: 502 },
      );
    }

    const raw = (await response.json()) as unknown;
    const boundary = normalizeAbsGccsaGeoJson(raw);
    const payload: GccsaBoundaryApiResponse = {
      boundary,
      source: {
        custodian: "Australian Bureau of Statistics",
        dataset: "ASGS Edition 4 Greater Capital City Statistical Areas",
        referenceYear: 2026,
        licence: "CC BY 4.0",
        serviceUrl,
        referenceUrl: ABS_GCCSA_2026_REFERENCE_URL,
      },
      status: {
        expectedRegions: 8,
        receivedRegions: boundary.features.length,
        complete: boundary.features.length === 8,
      },
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "ABS GCCSA boundary service could not be reached",
        source: serviceUrl,
      },
      { status: 502 },
    );
  }
}
