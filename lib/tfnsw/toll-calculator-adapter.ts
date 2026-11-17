import { majiConfig } from "@/lib/config/maji";
import { isTfnswConfigured } from "@/lib/config/tfnsw";
import { tfnswPostJson } from "@/lib/tfnsw/client";
import { encodeGooglePolyline } from "@/lib/transport/maji/polyline";
import type { TollLineStatus } from "@/types/maji";
import type { LatLng } from "@/types/transport-routing";

export type TollVehicleClass = "A" | "B";

export type TollEstimateResult = {
  tollCents: number | null;
  status: TollLineStatus;
};

type TfnswTollMatchResponse = {
  totalCost?: number | string;
  totalCharge?: number | string;
  amount?: number | string;
  cost?: number | string;
  currency?: string;
};

function parseDollarsToCents(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return null;
}

function extractTollCents(body: TfnswTollMatchResponse): number | null {
  return (
    parseDollarsToCents(body.totalCost) ??
    parseDollarsToCents(body.totalCharge) ??
    parseDollarsToCents(body.amount) ??
    parseDollarsToCents(body.cost)
  );
}

export function redactTollPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return { present: false };
  const record = body as Record<string, unknown>;
  return {
    keys: Object.keys(record).slice(0, 8),
    vehicleClass:
      typeof record.vehicleClass === "string" ? record.vehicleClass : undefined,
  };
}

export async function estimateTollsForGeometry(params: {
  geometry?: LatLng[];
  vehicleClass: TollVehicleClass;
}): Promise<TollEstimateResult> {
  if (!majiConfig.tollEstimatesEnabled || !isTfnswConfigured()) {
    return { tollCents: null, status: "insufficient_price_information" };
  }
  if (!params.geometry || params.geometry.length < 2) {
    return { tollCents: null, status: "insufficient_price_information" };
  }

  try {
    const encodedPolyline = encodeGooglePolyline(params.geometry);
    const body = await tfnswPostJson<TfnswTollMatchResponse>({
      path: "/v2/roads/toll_calc/match",
      body: {
        encodedPolyline,
        vehicleClass: params.vehicleClass,
      },
    });
    const tollCents = extractTollCents(body);
    if (tollCents == null) {
      return { tollCents: null, status: "insufficient_price_information" };
    }
    return { tollCents, status: "estimated" };
  } catch {
    return { tollCents: null, status: "insufficient_price_information" };
  }
}
