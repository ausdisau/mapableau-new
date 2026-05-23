export type CoordinatePair = { lat: number; lng: number };

export type ParticipantLocationDto = {
  id: string;
  label: string;
  suburb?: string | null;
  state?: string | null;
  lat: number;
  lng: number;
  isDefaultPickup: boolean;
};

export type ServiceSiteDto = {
  id: string;
  name: string;
  addressPublic?: string | null;
  suburb?: string | null;
  lat: number;
  lng: number;
  capabilities: Record<string, unknown>;
};
