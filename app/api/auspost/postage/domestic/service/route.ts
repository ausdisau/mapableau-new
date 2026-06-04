import { NextResponse } from "next/server";

import { isAuspostPacConfigured } from "@/lib/config/auspost-pac";
import { listDomesticParcelServices } from "@/lib/auspost-pac/domestic-parcel-service";
import { handleAuspostPacRouteError } from "@/lib/auspost-pac/route-handler";
import { domesticParcelServiceQuerySchema } from "@/lib/validation/auspost-pac-schemas";

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
  const parsed = domesticParcelServiceQuerySchema.safeParse({
    fromPostcode: searchParams.get("fromPostcode") ?? searchParams.get("from_postcode"),
    toPostcode: searchParams.get("toPostcode") ?? searchParams.get("to_postcode"),
    length: searchParams.get("length"),
    width: searchParams.get("width"),
    height: searchParams.get("height"),
    weight: searchParams.get("weight"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const services = await listDomesticParcelServices(parsed.data);
    return NextResponse.json({ services, configured: true });
  } catch (e) {
    return handleAuspostPacRouteError(e);
  }
}
