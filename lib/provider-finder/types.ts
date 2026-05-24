export type SupportArea =
  | "all"
  | "personal-care"
  | "transport"
  | "therapy"
  | "employment"
  | "home-help";

export type AccessNeed =
  | "wheelchair"
  | "auslan"
  | "low-sensory"
  | "hoist"
  | "complex";

export type FundingType = "all" | "ndis" | "plan-managed" | "self-managed" | "private";

export type ProviderProfile = {
  id: string;
  name: string;
  category: string;
  suburb: string;
  postcode?: string;
  serviceArea?: string;
  distanceLabel: string;
  rating: number;
  reviews: number;
  responseTime: string;
  funding: string;
  accessNeeds: string[];
  description: string;
  availability: string;
  featured: boolean;
  verified: boolean;
  coordinates?: { lat: number; lng: number };
  slug?: string;
};

export type ProviderSearchFilters = {
  query: string;
  location: string;
  supportArea: SupportArea;
  accessNeeds: AccessNeed[];
  fundingType: FundingType;
};
