/** Australian state abbreviations accepted by Australia Post PAC APIs. */
export type AusPostState = "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";

export type AusPostPacLocality = {
  location: string;
  state: AusPostState | string;
  postcode: string;
  category?: string;
};

export type AusPostPostcodeSearchResult = {
  localities: AusPostPacLocality[];
};

export type AusPostDomesticParcelService = {
  code: string;
  name: string;
  price?: number;
  maxWeight?: number;
  options?: AusPostServiceOption[];
};

export type AusPostServiceOption = {
  code: string;
  name: string;
  suboptions?: { code: string; name: string }[];
};

export type AusPostDomesticParcelCalculateResult = {
  service: string;
  deliveryTime?: string;
  totalCost: string;
  costs: { item: string; cost: string }[];
};

export type AusPostPacErrorCode =
  | "AUSPOST_PAC_NOT_CONFIGURED"
  | "AUSPOST_PAC_UPSTREAM_ERROR"
  | "AUSPOST_PAC_VALIDATION_ERROR";
