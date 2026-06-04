import { isAuspostPacConfigured } from "@/lib/config/auspost-pac";
import {
  AUSPOST_PAC_OPERATIONS,
  auspostPacJsonError,
  auspostPacJsonOk,
} from "@/lib/auspost-pac/api-contract";
import { calculateDomesticParcelPostage } from "@/lib/auspost-pac/domestic-parcel-service";
import { handleAuspostPacRouteError } from "@/lib/auspost-pac/route-handler";
import { domesticParcelCalculateQuerySchema } from "@/lib/validation/auspost-pac-schemas";

const OPERATION = AUSPOST_PAC_OPERATIONS.domesticParcelCalculate;

export async function GET(request: Request) {
  if (!isAuspostPacConfigured()) {
    return auspostPacJsonError(OPERATION, 503, {
      error: "Australia Post PAC is not configured.",
      code: "AUSPOST_PAC_NOT_CONFIGURED",
      details: { configured: false },
      retryable: false,
    });
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
    return auspostPacJsonError(OPERATION, 400, {
      error: "Invalid query",
      code: "INVALID_QUERY",
      details: parsed.error.flatten(),
      retryable: false,
    });
  }

  try {
    const quote = await calculateDomesticParcelPostage(parsed.data);
    return auspostPacJsonOk(OPERATION, { quote, configured: true });
  } catch (e) {
    return handleAuspostPacRouteError(e, OPERATION);
  }
}
