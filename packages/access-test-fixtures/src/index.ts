/**
 * @mapable/access-test-fixtures — synthetic buildings and passports for regression.
 */

export const FIXTURE_PASSPORT_WHEELCHAIR = {
  id: "fixture-wheelchair",
  name: "Manual wheelchair",
  requirements: [
    {
      id: "r-sf",
      featureType: "step_free",
      importance: "required" as const,
      operator: "available" as const,
      value: true,
      shareWithVenue: true,
    },
    {
      id: "r-door",
      featureType: "clear_door_width_mm",
      importance: "required" as const,
      operator: "minimum" as const,
      value: 850,
      unit: "mm",
      shareWithVenue: true,
    },
  ],
};

export const FIXTURE_BUILDING_CAFE = {
  code: "synth-cafe-fixture",
  buildingType: "cafe",
  doorWidthMm: 820,
  stepFree: false,
};

export const FIXTURE_BUILDING_HALL = {
  code: "synth-hall-fixture",
  buildingType: "community_hall",
  doorWidthMm: 920,
  stepFree: true,
};
