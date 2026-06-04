import { auspostPacGetJson } from "@/lib/auspost-pac/client";
import {
  normalizeDomesticCalculateResponse,
  normalizeDomesticServiceResponse,
} from "@/lib/auspost-pac/normalize";
import { auspostPacValidationError } from "@/lib/auspost-pac/auspost-pac-api-error";
import type {
  AusPostDomesticParcelCalculateResult,
  AusPostDomesticParcelService,
} from "@/types/auspost-pac";

export type DomesticParcelDimensions = {
  fromPostcode: string;
  toPostcode: string;
  length: number;
  width: number;
  height: number;
  weight: number;
};

export type DomesticParcelCalculateParams = DomesticParcelDimensions & {
  serviceCode: string;
  optionCode?: string;
  suboptionCode?: string;
  extraCover?: number;
};

export async function listDomesticParcelServices(
  dims: DomesticParcelDimensions,
): Promise<AusPostDomesticParcelService[]> {
  const raw = await auspostPacGetJson<unknown>({
    path: "/postage/parcel/domestic/service.json",
    query: {
      from_postcode: dims.fromPostcode,
      to_postcode: dims.toPostcode,
      length: dims.length,
      width: dims.width,
      height: dims.height,
      weight: dims.weight,
    },
  });
  return normalizeDomesticServiceResponse(
    raw as Parameters<typeof normalizeDomesticServiceResponse>[0],
  );
}

export async function calculateDomesticParcelPostage(
  params: DomesticParcelCalculateParams,
): Promise<AusPostDomesticParcelCalculateResult> {
  const raw = await auspostPacGetJson<unknown>({
    path: "/postage/parcel/domestic/calculate.json",
    query: {
      from_postcode: params.fromPostcode,
      to_postcode: params.toPostcode,
      length: params.length,
      width: params.width,
      height: params.height,
      weight: params.weight,
      service_code: params.serviceCode,
      ...(params.optionCode ? { option_code: params.optionCode } : {}),
      ...(params.suboptionCode ? { suboption_code: params.suboptionCode } : {}),
      ...(params.extraCover != null ? { extra_cover: params.extraCover } : {}),
    },
  });
  const result = normalizeDomesticCalculateResponse(
    raw as Parameters<typeof normalizeDomesticCalculateResponse>[0],
  );
  if (!result) {
    throw auspostPacValidationError(
      "Australia Post did not return a postage quote for those parameters.",
      raw,
    );
  }
  return result;
}

export async function listDomesticParcelBoxSizes(): Promise<unknown> {
  return auspostPacGetJson({ path: "/postage/parcel/domestic/size.json" });
}
