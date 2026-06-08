export type UberLatLng = {
  latitude: number;
  longitude: number;
};

export type UberGuest = {
  first_name: string;
  last_name?: string;
  email?: string;
  phone_number: string;
  locale?: string;
};

export type UberTripEstimatesRequest = {
  pickup: UberLatLng;
  dropoff: UberLatLng;
  scheduling?: {
    pickup_time?: number;
  };
};

export type UberProductEstimate = {
  product_id?: string;
  display_name?: string;
  estimate?: string;
  currency_code?: string;
  low_estimate?: number;
  high_estimate?: number;
  trip_duration_estimate?: number;
};

export type UberTripEstimatesResponse = {
  product_estimates?: UberProductEstimate[];
  etas_unavailable?: boolean;
  fares_unavailable?: boolean;
};

export type UberCreateGuestTripRequest = {
  guest: UberGuest;
  pickup: UberLatLng & { address?: string };
  dropoff: UberLatLng & { address?: string };
  product_id?: string;
  fare_id?: string;
  scheduling?: {
    pickup_time?: number;
  };
  note_for_driver?: string;
  sender_display_name?: string;
};

export type UberGuestTrip = {
  request_id: string;
  status?: string;
  status_detail?: string;
  guest?: UberGuest & { guest_id?: string };
  pickup?: UberLatLng & { address?: string };
  dropoff?: UberLatLng & { address?: string };
  product_id?: string;
  driver?: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
  location?: Record<string, unknown>;
  begin_trip_time?: number;
  dropoff_time?: number;
};

export type UberListTripsParams = {
  trip_status?: "ACTIVE" | "PAST" | "EXPIRED";
  start_key?: string;
  limit?: number;
};

export type UberListTripsResponse = {
  next_key?: string;
  trips?: UberGuestTrip[];
};
