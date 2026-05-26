import type { AutocompleteField } from "@/types/search";

export type ProviderSearchFormField =
  | "all"
  | "location"
  | "accessibility"
  | "service"
  | "provider";

export type ProviderSearchFieldDefinition = {
  autocompleteField: AutocompleteField;
  openSearchFields: string[];
  sourceFields: string[];
};

export const MAPABLE_PROVIDER_SEARCH_FIELD_SCHEMA = {
  all: {
    autocompleteField: "all",
    openSearchFields: [
      "name",
      "outletName",
      "serviceNames",
      "suburb",
      "state",
      "postcode",
      "abn",
      "searchText",
    ],
    sourceFields: [
      "Prov_N",
      "Outletname",
      "RegGroup",
      "prfsn",
      "Head_Office",
      "Address",
      "State_cd",
      "Post_cd",
      "ABN",
    ],
  },
  location: {
    autocompleteField: "postcode",
    openSearchFields: ["suburb", "state", "postcode", "locationText"],
    sourceFields: ["Address", "Head_Office", "State_cd", "Post_cd"],
  },
  accessibility: {
    autocompleteField: "accessibility",
    openSearchFields: ["serviceNames", "supportModes", "searchText"],
    sourceFields: ["RegGroup", "prfsn"],
  },
  service: {
    autocompleteField: "service",
    openSearchFields: ["serviceNames", "searchText"],
    sourceFields: ["RegGroup", "prfsn"],
  },
  provider: {
    autocompleteField: "provider",
    openSearchFields: ["name", "outletName", "abn", "searchText"],
    sourceFields: ["Prov_N", "Outletname", "ABN"],
  },
} as const satisfies Record<ProviderSearchFormField, ProviderSearchFieldDefinition>;

export const PROVIDER_PUBLIC_SEARCH_FIELDS = [
  "id",
  "legacyProviderId",
  "slug",
  "name",
  "outletName",
  "suburb",
  "state",
  "postcode",
  "latitude",
  "longitude",
  "isVerified",
  "isSearchVisible",
  "abn",
  "serviceNames",
  "supportModes",
  "source",
] as const;
