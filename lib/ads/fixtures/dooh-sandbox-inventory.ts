/** Synthetic Australian DOOH screens — fixtures only, not live availability. */

export type SyntheticDoohScreen = {
  providerScreenId: string;
  publisherId: string;
  countryCode: string;
  timeZone: string;
  venueType: string;
  siteLabel: string;
  approximatePublicCoordinates: { lat: number; lng: number };
  creativeSpecs: {
    pixelWidth: number;
    pixelHeight: number;
    aspectRatio: string;
    allowedMime: string[];
    durationSeconds: number;
  };
  restrictions: string[];
  inventoryObservedAt: string;
  availabilityKind: "indicative";
  dataLicence: "synthetic_fixture";
};

export const SYNTHETIC_DOOH_SCREENS: SyntheticDoohScreen[] = [
  {
    providerScreenId: "au-syd-rail-01",
    publisherId: "sandbox-publisher",
    countryCode: "AU",
    timeZone: "Australia/Sydney",
    venueType: "rail",
    siteLabel: "Synthetic Sydney Rail Concourse",
    approximatePublicCoordinates: { lat: -33.883, lng: 151.206 },
    creativeSpecs: {
      pixelWidth: 1920,
      pixelHeight: 1080,
      aspectRatio: "16:9",
      allowedMime: ["image/jpeg", "image/png", "video/mp4"],
      durationSeconds: 10,
    },
    restrictions: ["no_flash", "captions_required_for_video"],
    inventoryObservedAt: "2026-11-01T00:00:00.000Z",
    availabilityKind: "indicative",
    dataLicence: "synthetic_fixture",
  },
  {
    providerScreenId: "au-syd-retail-02",
    publisherId: "sandbox-publisher",
    countryCode: "AU",
    timeZone: "Australia/Sydney",
    venueType: "retail",
    siteLabel: "Synthetic Sydney Retail Atrium",
    approximatePublicCoordinates: { lat: -33.87, lng: 151.21 },
    creativeSpecs: {
      pixelWidth: 1080,
      pixelHeight: 1920,
      aspectRatio: "9:16",
      allowedMime: ["image/jpeg", "image/png"],
      durationSeconds: 8,
    },
    restrictions: ["no_audio"],
    inventoryObservedAt: "2026-11-01T00:00:00.000Z",
    availabilityKind: "indicative",
    dataLicence: "synthetic_fixture",
  },
  {
    providerScreenId: "au-mel-street-03",
    publisherId: "sandbox-publisher",
    countryCode: "AU",
    timeZone: "Australia/Melbourne",
    venueType: "street",
    siteLabel: "Synthetic Melbourne Street Panel",
    approximatePublicCoordinates: { lat: -37.8136, lng: 144.9631 },
    creativeSpecs: {
      pixelWidth: 1440,
      pixelHeight: 2560,
      aspectRatio: "9:16",
      allowedMime: ["image/jpeg", "image/png"],
      durationSeconds: 10,
    },
    restrictions: ["strobe_forbidden"],
    inventoryObservedAt: "2026-10-15T00:00:00.000Z",
    availabilityKind: "indicative",
    dataLicence: "synthetic_fixture",
  },
];
