/**
 * Access Address Intelligence and related spatial product flags.
 * All default false — opt-in with exact "true".
 */

function flag(name: string): boolean {
  return process.env[name] === "true";
}

export const accessAddressIntelligenceFlags = {
  get predictiveEnabled() {
    return flag("GEOSCAPE_PREDICTIVE_ENABLED");
  },
  get addressIntelligenceEnabled() {
    return flag("MAPABLE_ACCESS_ADDRESS_INTELLIGENCE_ENABLED");
  },
  get buildingConfirmationEnabled() {
    return flag("MAPABLE_ADDRESS_BUILDING_CONFIRMATION_ENABLED");
  },
  get entranceResolverEnabled() {
    return flag("MAPABLE_ENTRANCE_RESOLVER_ENABLED");
  },
  get dropOffResolverEnabled() {
    return flag("MAPABLE_DROP_OFF_RESOLVER_ENABLED");
  },
  get providerServiceAreasEnabled() {
    return flag("MAPABLE_PROVIDER_SERVICE_AREAS_ENABLED");
  },
};

export function isAccessAddressIntelligenceAvailable(): boolean {
  return (
    accessAddressIntelligenceFlags.addressIntelligenceEnabled &&
    accessAddressIntelligenceFlags.predictiveEnabled &&
    Boolean(
      (process.env.GEOSCAPE_API_KEY ?? process.env.GEOSCAPE_PREDICTIVE_API_KEY)
        ?.trim(),
    )
  );
}
