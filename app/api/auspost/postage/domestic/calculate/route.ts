import { NextResponse } from "next/server";

import { isAuspostPacConfigured } from "@/lib/config/auspost-pac";
import { calculateDomesticParcelPostage } from "@/lib/auspost-pac/domestic-parcel-service";
import { handleAuspostPacRouteError } from "@/lib/auspost-pac/route-handler";
import { domesticParcelCalculateQuerySchema } from "@/lib/validation/auspost-pac-schemas";

export async function GET(request: Request) {
  if (!isAuspostPacConfigured()) {
    return NextResponse.json(
      {
        error: "Australia Post PAC is not configured.",
        code: "AUSPOST_PAC_NOT_CONFIGURED",
        configured: false,
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = domesticParcelCalculateQuerySchema.safeParse({
    fromPostcode: searchParams.get("fromPostcode") ?? searchParams.get("from_postcode"),
    toPostcode: searchParams.get("toPostcode") ?? searchParams.get("to_postcode"),
    length: searchParams.get("length"),
    width: searchParams.get("width"),
    height: searchParams.get("height"),
    weight: searchParams.get("weight"),
    serviceCode:
      searchParams.get("serviceCode") ?? searchParams.get("service_code"),
    optionCode: searchParams.get("optionCode") ?? searchParams.get("option_code"),
    suboptionCode:
      searchParams.get("suboptionCode") ?? searchParams.get("suboption_code"),
    extraCover: searchParams.get("extraCover") ?? searchParams.get("extra_cover"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const quote = await calculateDomesticParcelPostage(parsed.data);
    return NextResponse.json({ quote, configured: true });
  } catch (e) {
    return handleAuspostPacRouteError(e);
  }
}
