/** Public verification labels shown on provider profiles (not proof of endorsement). */
export type ProviderVerificationLabel =
  | "unverified"
  | "community_listed"
  | "documents_submitted"
  | "mapable_reviewed"
  | "ndis_registered";

export type PublicProviderService = {
  id: string;
  name: string;
  description?: string;
};

export type PublicProviderRegion = {
  id: string;
  label: string;
  suburb?: string;
  state?: string;
  postcode?: string;
};

export type PublicProviderReview = {
  id: string;
  authorLabel: string;
  body: string;
  rating: number;
};

export type PublicProviderProfile = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  verificationLabel: ProviderVerificationLabel;
  verificationDisplay: string;
  ndisRegistered: boolean;
  ndisNumber?: string;
  services: PublicProviderService[];
  regions: PublicProviderRegion[];
  accessFeatures: string[];
  languages: string[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    abn?: string;
  };
  rating: number;
  reviewCount: number;
  reviews: PublicProviderReview[];
  supports: string[];
  categories: string[];
  openingHours?: string;
  latitude?: number;
  longitude?: number;
  outletKey?: string;
  source: "directory" | "registered" | "claimed" | "profile";
  showUnverifiedWarning: boolean;
  canRequestSupport: boolean;
};

export const VERIFICATION_DISPLAY: Record<ProviderVerificationLabel, string> = {
  unverified: "Unverified",
  community_listed: "Community listed",
  documents_submitted: "Documents submitted",
  mapable_reviewed: "MapAble reviewed",
  ndis_registered: "NDIS registered",
};
