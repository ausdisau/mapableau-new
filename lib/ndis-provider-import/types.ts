import type { ProviderOutlet } from "@/data/provider-outlets.types";

export type NdisProviderListFile = {
  date?: string;
  data: ProviderOutlet[];
};

export type AggregatedNdisProvider = {
  abn: string;
  name: string;
  ndisRegistered: boolean;
  email?: string;
  phone?: string;
  website?: string;
  serviceAreas: string[];
  specialisations: string[];
  locations: {
    address: string;
    city?: string;
    state?: string;
    postcode?: string;
    country: string;
  }[];
  services: { name: string; description?: string }[];
};
