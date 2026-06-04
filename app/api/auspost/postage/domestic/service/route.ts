import { isAuspostPacConfigured } from "@/lib/config/auspost-pac";
import {
  AUSPOST_PAC_OPERATIONS,
  auspostPacJsonError,
  auspostPacJsonOk,
} from "@/lib/auspost-pac/api-contract";
import { listDomesticParcelServices } from "@/lib/auspost-pac/domestic-parcel-service";
import { handleAuspostPacRouteError } from "@/lib/auspost-pac/route-handler";
import { domesticParcelServiceQuerySchema } from "@/lib/validation/auspost-pac-schemas";

const OPERATION = AUSPOST_PAC_OPERATIONS.domesticParcelServices;

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
  const parsed = domesticParcelServiceQuerySchema.safeParse({
    fromPostcode: searchParams.get("fromPostcode") ?? searchParams.get("from_postcode"),
    toPostcode: searchParams.get("toPostcode") ?? searchParams.get("to_postcode"),
    length: searchParams.get("length"),
    width: searchParams.get("width"),
    height: searchParams.get("height"),
    weight: searchParams.get("weight"),
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
    const services = await listDomesticParcelServices(parsed.data);
    return auspostPacJsonOk(OPERATION, { services, configured: true });
  } catch (e) {
    return handleAuspostPacRouteError(e, OPERATION);
  }
}
