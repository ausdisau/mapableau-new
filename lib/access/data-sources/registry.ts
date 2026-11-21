export const MAPABLE_DATA_CLASSES = [
  "OPEN_EVIDENCE",
  "CONTROLLED_RESEARCH",
  "PARTICIPANT_CONTROLLED",
] as const;
export type MapAbleDataClass = (typeof MAPABLE_DATA_CLASSES)[number];

export const DATA_ACCESS_MODES = [
  "OPEN",
  "CONTROLLED_RESEARCH_ENVIRONMENT",
  "PARTICIPANT_CONSENT",
] as const;
export type DataAccessMode = (typeof DATA_ACCESS_MODES)[number];

export type DataSourceLicence = {
  id: string;
  uri?: string;
  attributionText?: string;
  attributionRequired: boolean;
};

export type MapAbleDataSource = {
  id: string;
  label: string;
  steward: string;
  sourceUri: string | null;
  dataClass: MapAbleDataClass;
  accessMode: DataAccessMode;
  operationalImport: boolean;
  requiresDatasetLevelLicence: boolean;
  licence: DataSourceLicence | null;
  allowedUses: readonly string[];
  prohibitedUses: readonly string[];
};

export type IngestionAdmission = {
  allowed: boolean;
  reason: string;
};

export const PROVENANCE_VERIFICATION_STATUSES = [
  "UNVERIFIED",
  "OBSERVED",
  "CORROBORATED",
  "INDEPENDENTLY_VERIFIED",
  "DISPUTED",
  "STALE",
] as const;
export type ProvenanceVerificationStatus =
  (typeof PROVENANCE_VERIFICATION_STATUSES)[number];

export type ProvenanceEnvelope = {
  dataSourceId: string;
  sourceRecordId: string;
  sourceUri: string;
  retrievedAt: string;
  observedAt?: string;
  contentHash: string;
  licenceId?: string;
  attributionText?: string;
  verificationStatus: ProvenanceVerificationStatus;
  confidence?: number | null;
  machineDerived: boolean;
};

export type ObservationFingerprint = {
  dataSourceId: string;
  sourceRecordId: string;
  contentHash: string;
  claimKey: string;
  valueFingerprint: string;
};

export type ObservationChange =
  | "CREATE"
  | "DUPLICATE"
  | "SUPERSEDE"
  | "CONFLICT";

/**
 * Governance registry for source classes used by the Accessibility Data Fabric.
 *
 * A portal entry whose child datasets have independent reuse terms stays
 * `operationalImport: false` until an adapter registers the exact dataset-level
 * licence. Controlled research assets are never operational ingest sources.
 */
const DATA_SOURCES = [
  {
    id: "ahrc-disability-rights-statistics",
    label: "AHRC disability rights statistics",
    steward: "Australian Human Rights Commission",
    sourceUri:
      "https://humanrights.gov.au/human-rights-education/stats-and-facts-about-discrimination/statistics-about-disability-rights-0",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: true,
    requiresDatasetLevelLicence: false,
    licence: {
      id: "CC-BY-4.0",
      uri: "https://creativecommons.org/licenses/by/4.0/",
      attributionText: "Australian Human Rights Commission",
      attributionRequired: true,
    },
    allowedUses: ["aggregate_rights_indicators", "rights_taxonomy"],
    prohibitedUses: ["individual_complaint_mapping", "legal_breach_determination"],
  },
  {
    id: "ahrc-dda-action-plan-register",
    label: "AHRC DDA Action Plan Register",
    steward: "Australian Human Rights Commission",
    sourceUri:
      "https://humanrights.gov.au/resource-hub/by-resource-type/publications/guidelines/action-plans-and-guides/register-disability-discrimination-act-action-plans",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: true,
    requiresDatasetLevelLicence: false,
    licence: {
      id: "CC-BY-4.0",
      uri: "https://creativecommons.org/licenses/by/4.0/",
      attributionText: "Australian Human Rights Commission",
      attributionRequired: true,
    },
    allowedUses: ["organisation_accessibility_commitment_metadata"],
    prohibitedUses: ["ahrc_endorsement_claim", "accessibility_certification_claim"],
  },
  {
    id: "aihw-ads-outcomes-framework",
    label: "Australia's Disability Strategy Outcomes Framework",
    steward: "Australian Institute of Health and Welfare",
    sourceUri: "https://www.aihw.gov.au/australias-disability-strategy",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["aggregate_outcome_indicators"],
    prohibitedUses: ["individual_outcome_prediction"],
  },
  {
    id: "abs-plida",
    label: "Person Level Integrated Data Asset (PLIDA)",
    steward: "Australian Bureau of Statistics",
    sourceUri:
      "https://www.abs.gov.au/statistics/microdata-tablebuilder/available-microdata-tablebuilder/person-level-integrated-data-asset-plida",
    dataClass: "CONTROLLED_RESEARCH",
    accessMode: "CONTROLLED_RESEARCH_ENVIRONMENT",
    operationalImport: false,
    requiresDatasetLevelLicence: false,
    licence: null,
    allowedUses: ["approved_research", "disclosure_cleared_aggregate_findings"],
    prohibitedUses: [
      "microdata_export_to_mapable",
      "individual_eligibility_scoring",
      "reidentification",
    ],
  },
  {
    id: "aihw-national-health-data-hub",
    label: "National Health Data Hub",
    steward: "Australian Institute of Health and Welfare",
    sourceUri: "https://www.aihw.gov.au/reports-data/nhdh",
    dataClass: "CONTROLLED_RESEARCH",
    accessMode: "CONTROLLED_RESEARCH_ENVIRONMENT",
    operationalImport: false,
    requiresDatasetLevelLicence: false,
    licence: null,
    allowedUses: ["approved_research", "disclosure_cleared_aggregate_findings"],
    prohibitedUses: [
      "microdata_export_to_mapable",
      "individual_clinical_prediction",
      "reidentification",
    ],
  },
  {
    id: "ndis-public-data",
    label: "NDIS public datasets",
    steward: "National Disability Insurance Agency",
    sourceUri: "https://dataresearch.ndis.gov.au/datasets",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["aggregate_market_analysis", "provider_market_context"],
    prohibitedUses: ["participant_identification", "worker_clearance_inference"],
  },
  {
    id: "transport-for-nsw-open-data",
    label: "Transport for NSW Open Data",
    steward: "Transport for NSW",
    sourceUri: "https://opendata.transport.nsw.gov.au/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["transport_accessibility_evidence", "routing_context"],
    prohibitedUses: ["accessibility_guarantee_without_current_evidence"],
  },
  {
    id: "national-public-toilet-map",
    label: "National Public Toilet Map",
    steward: "Australian Government",
    sourceUri: "https://data.gov.au/data/dataset/national-public-toilet-map",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: true,
    requiresDatasetLevelLicence: false,
    licence: {
      id: "CC-BY-3.0-AU",
      uri: "https://creativecommons.org/licenses/by/3.0/au/",
      attributionText: "National Public Toilet Map",
      attributionRequired: true,
    },
    allowedUses: ["accessible_toilet_features", "amenity_discovery"],
    prohibitedUses: ["current_accessibility_guarantee_without_freshness_check"],
  },
  {
    id: "openstreetmap",
    label: "OpenStreetMap",
    steward: "OpenStreetMap contributors",
    sourceUri: "https://www.openstreetmap.org/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: true,
    requiresDatasetLevelLicence: false,
    licence: {
      id: "ODbL-1.0",
      uri: "https://opendatacommons.org/licenses/odbl/1-0/",
      attributionText: "© OpenStreetMap contributors",
      attributionRequired: true,
    },
    allowedUses: ["base_geography", "accessibility_observations"],
    prohibitedUses: ["licence_attribution_removal", "silent_verified_accessibility_claim"],
  },

  // Candidate municipal/territory and Aotearoa sources. Listing never enables ingestion.
  {
    id: "city-of-sydney-accessibility-map",
    label: "City of Sydney accessibility map (ArcGIS viewer)",
    steward: "City of Sydney",
    sourceUri: "https://cityofsydney.maps.arcgis.com/apps/webappviewer/index.html?id=ca717c4e82774e189c3a60215b67f230",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["candidate_path_effort_evidence","accessible_infrastructure_discovery"],
    prohibitedUses: ["accessibility_guarantee_without_current_verification","licence_free_import_assumption","live_route_evidence_without_graph_validation"],
  },
  {
    id: "city-of-melbourne-clue-building-information",
    label: "Melbourne CLUE buildings: accessibility and bicycle facilities",
    steward: "City of Melbourne",
    sourceUri: "https://data.melbourne.vic.gov.au/explore/dataset/buildings-with-name-age-size-accessibility-and-bicycle-facilities/information/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["building_entrance_context","destination_access_evidence"],
    prohibitedUses: ["accessibility_guarantee_without_current_verification","licence_free_import_assumption","live_route_evidence_without_graph_validation"],
  },
  {
    id: "brisbane-spatial-accessibility-catalogue",
    label: "Brisbane spatial open-data accessibility search",
    steward: "Brisbane City Council",
    sourceUri: "https://spatial-brisbane.opendata.arcgis.com/search?q=accessibility",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["candidate_kerb_ramp_discovery","mobility_parking_discovery"],
    prohibitedUses: ["accessibility_guarantee_without_current_verification","licence_free_import_assumption","live_route_evidence_without_graph_validation"],
  },
  {
    id: "arcgis-item-ffa2876916fd4e9fa25eca58aaf497ef",
    label: "ArcGIS item ffa28769 (publisher and layer not yet identified)",
    steward: "Unverified ArcGIS publisher",
    sourceUri: "https://www.arcgis.com/home/item.html?id=ffa2876916fd4e9fa25eca58aaf497ef",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["metadata_review_only"],
    prohibitedUses: ["accessibility_guarantee_without_current_verification","licence_free_import_assumption","live_route_evidence_without_graph_validation"],
  },
  {
    id: "data-sa-disability-search",
    label: "South Australian open-data disability catalogue search",
    steward: "South Australian Government open-data catalogue",
    sourceUri: "https://data.sa.gov.au/data/dataset?q=disability",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["candidate_dataset_discovery"],
    prohibitedUses: ["accessibility_guarantee_without_current_verification","licence_free_import_assumption","live_route_evidence_without_graph_validation"],
  },
  {
    id: "city-of-darwin-accessibility-map",
    label: "City of Darwin accessibility map",
    steward: "City of Darwin",
    sourceUri: "https://www.darwin.nt.gov.au/community/programs/access-and-inclusion/accessibility-map",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["destination_access_discovery","accessible_amenities_discovery"],
    prohibitedUses: ["accessibility_guarantee_without_current_verification","licence_free_import_assumption","live_route_evidence_without_graph_validation"],
  },
  {
    id: "nt-government-open-data-catalogue",
    label: "Northern Territory Government open-data portal",
    steward: "Northern Territory Government",
    sourceUri: "https://data.nt.gov.au/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["spatial_dataset_discovery"],
    prohibitedUses: ["accessibility_guarantee_without_current_verification","licence_free_import_assumption","live_route_evidence_without_graph_validation"],
  },
  {
    id: "nt-dlpe-spatial-data-requests",
    label: "Northern Territory DLPE natural resource maps and spatial requests",
    steward: "NT Department of Lands, Planning and Environment",
    sourceUri: "https://environment.nt.gov.au/natural-resource-management/info-systems/natural-resource-maps/spatial-data-requests",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["contextual_geospatial_discovery"],
    prohibitedUses: ["accessibility_guarantee_without_current_verification","licence_free_import_assumption","live_route_evidence_without_graph_validation"],
  },
  {
    id: "city-of-perth-toilet-accessibility",
    label: "City of Perth toilet accessibility point dataset",
    steward: "City of Perth",
    sourceUri: "https://geohub-perth.opendata.arcgis.com/datasets/perth::toilet-accessibility",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: false,
    licence: {
      "id": "CC-BY-4.0",
      "uri": "https://creativecommons.org/licenses/by/4.0/",
      "attributionText": "City of Perth — Toilet Accessibility",
      "attributionRequired": true
    },
    allowedUses: ["accessible_toilet_discovery","destination_access_evidence_review"],
    prohibitedUses: ["unverified_accessibility_guarantee","unreviewed_2022_access_observations_as_current","duplicate_unreviewed_records","live_routing_from_point_data"],
  },
  {
    id: "stats-nz-datafinder-viewer-layer-123498",
    label: "Stats NZ Datafinder viewer layer 123498 (exact metadata pending)",
    steward: "Stats NZ / Tatauranga Aotearoa (viewer provider; exact layer custodian unverified)",
    sourceUri: "https://datafinder.stats.govt.nz/mapviewer/?mv.basemap=Streets&mv.centre=175.14999999999998%2C-41.03753612338015&mv.content=layer.123498.color%3A003399&mv.zoom=3",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["geographic_remoteness_context_only_after_layer_verification"],
    prohibitedUses: ["wheelchair_routing","pedestrian_accessibility_inference","disability_accessibility_guarantee","unlicensed_operational_import"],
  },

  // International research/catalogue leads only: none are authorised for production ingestion.
  {
    id: "hdx-papua-new-guinea-accessibility-indicators",
    label: "HDX Papua New Guinea accessibility indicators (metadata unverified)",
    steward: "HDX catalogue; dataset contributor not verified",
    sourceUri: "https://data.humdata.org/dataset/papua-new-guinea-accessibility-indicators",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["humanitarian_accessibility_indicator_research_after_metadata_review"],
    prohibitedUses: ["wheelchair_route_claims","participant_specific_routing","licence_assumption","missing_metadata_as_verified"],
  },
  {
    id: "hdx-hotosm-singapore-roads",
    label: "HDX HOTOSM Singapore roads candidate extract",
    steward: "Humanitarian OpenStreetMap Team / OpenStreetMap contributors (exact resource unverified)",
    sourceUri: "https://data.humdata.org/dataset/hotosm_sgp_roads",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["osrm_network_research_after_resource_verification","osm_tag_coverage_review"],
    prohibitedUses: ["duplicating_existing_osm_source_identity","automatic_step_free_route_claim","unlicensed_operational_import"],
  },
  {
    id: "heigit-openaccesslens-global",
    label: "HeiGIT OpenAccessLens global healthcare and education access",
    steward: "HeiGIT / GIScience Research Group",
    sourceUri: "https://heigit.org/global-data-on-healthcare-and-education-accessibility-with-openaccesslens/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["aggregate_service_access_research","humanitarian_planning_context"],
    prohibitedUses: ["pedestrian_routing","wheelchair_accessibility_inference","real_time_route_claim","patient_level_prediction"],
  },
  {
    id: "malaria-atlas-earth-engine-accessibility-catalogue",
    label: "Malaria Atlas Project Earth Engine accessibility raster catalogue",
    steward: "Malaria Atlas Project; hosted via Google Earth Engine",
    sourceUri: "https://developers.google.com/earth-engine/datasets/tags/accessibility",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["historical_area_level_travel_time_research","aggregate_healthcare_reach_analysis"],
    prohibitedUses: ["wheelchair_navigation","raster_cells_as_path_edges","historical_estimates_as_current","unverified_dataset_level_licence"],
  },
  {
    id: "singapore-lta-datamall",
    label: "Singapore Land Transport Authority DataMall",
    steward: "Singapore Land Transport Authority",
    sourceUri: "https://datamall.lta.gov.sg/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["transport_stop_and_facility_metadata_discovery","geospatial_layer_catalogue_review"],
    prohibitedUses: ["unregistered_api_use","blanket_geojson_or_kml_availability_claim","wheelchair_accessibility_guarantee"],
  },
  {
    id: "singapore-data-gov-sg",
    label: "Singapore government data catalogue",
    steward: "Government of Singapore",
    sourceUri: "https://data.gov.sg/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["public_transport_and_amenity_dataset_discovery"],
    prohibitedUses: ["catalogue_level_licence_inheritance","wheelchair_route_claim_without_field_evidence"],
  },
  {
    id: "singapore-onemap",
    label: "Singapore Land Authority OneMap",
    steward: "Singapore Land Authority",
    sourceUri: "https://www.onemap.gov.sg/apidocs/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["geographic_and_amenity_reference_research","coordinate_reference_validation"],
    prohibitedUses: ["unapproved_api_and_map_reuse","walking_route_as_wheelchair_route","bypassing_service_terms"],
  },
  {
    id: "india-geodata-catalogue",
    label: "India Geodata community curated catalogue",
    steward: "India Geodata project (multiple source publishers)",
    sourceUri: "https://yashveeeeeeer.github.io/india-geodata/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["geospatial_dataset_discovery","infrastructure_context_research"],
    prohibitedUses: ["assumed_uniform_licence","administrative_boundaries_as_accessibility_evidence","live_navigation_without_graph_audit"],
  },
  {
    id: "india-open-city-geojson-catalogue",
    label: "Open City India GeoJSON dataset filter",
    steward: "Open City India (child dataset publishers vary)",
    sourceUri: "https://data.opencity.in/dataset/?res_format=GeoJSON",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["municipal_and_transit_dataset_discovery"],
    prohibitedUses: ["portal_level_import_approval","format_guarantee_for_all_child_datasets","wheelchair_navigation_claim_without_measurement"],
  },
  {
    id: "wheelmap-accessibility-cloud-source-lead",
    label: "Wheelmap / accessibility.cloud partner data source lead",
    steward: "SOZIALHELDEN e.V. and individual contributing data partners",
    sourceUri: "https://news.wheelmap.org/en/faq/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["venue_accessibility_metadata_discovery","partner_licence_and_provenance_research"],
    prohibitedUses: ["automatic_partner_licence_inheritance_from_osm","duplicate_osm_observations","wheelchair_route_assurance_from_venue_tag"],
  },
  {
    id: "google-open-buildings-footprints",
    label: "Google Research Open Buildings footprints",
    steward: "Google Research",
    sourceUri: "https://sites.research.google/gr/open-buildings/",
    dataClass: "OPEN_EVIDENCE",
    accessMode: "OPEN",
    operationalImport: false,
    requiresDatasetLevelLicence: true,
    licence: null,
    allowedUses: ["settlement_and_building_footprint_research"],
    prohibitedUses: ["building_footprint_as_accessible_entrance","wheelchair_footpath_inference","claim_that_this_is_malaria_atlas_travel_time"],
  },
] as const satisfies readonly MapAbleDataSource[];

const dataSourceById = new Map<string, MapAbleDataSource>(
  DATA_SOURCES.map((source) => [source.id, source]),
);

export function listDataSources(): readonly MapAbleDataSource[] {
  return DATA_SOURCES;
}

export function getDataSource(id: string): MapAbleDataSource {
  const source = dataSourceById.get(id);
  if (!source) throw new Error(`Unknown MapAble data source: ${id}`);
  return source;
}

export function evaluateOperationalIngestion(
  source: MapAbleDataSource,
): IngestionAdmission {
  if (source.dataClass === "CONTROLLED_RESEARCH") {
    return {
      allowed: false,
      reason:
        "Controlled research microdata must remain inside its approved research environment; only disclosure-cleared aggregate findings may cross the research firewall.",
    };
  }

  if (source.dataClass === "PARTICIPANT_CONTROLLED") {
    return {
      allowed: false,
      reason:
        "Participant-controlled data is purpose-bound personal information and must not enter the bulk external dataset ingestion pipeline.",
    };
  }

  if (source.requiresDatasetLevelLicence) {
    return {
      allowed: false,
      reason:
        "Dataset-level licence or terms must be recorded before operational ingestion is enabled for this source.",
    };
  }

  if (!source.operationalImport) {
    return {
      allowed: false,
      reason: "This source is not admitted for operational ingestion.",
    };
  }

  if (!source.licence?.id) {
    return {
      allowed: false,
      reason: "Operational ingestion requires recorded licence or reuse terms.",
    };
  }

  if (
    source.licence.attributionRequired &&
    !source.licence.attributionText?.trim()
  ) {
    return {
      allowed: false,
      reason: "Required source attribution metadata is missing.",
    };
  }

  return {
    allowed: true,
    reason: "Source is admitted for operational ingestion with recorded reuse metadata.",
  };
}

export function assertOperationalIngestionAllowed(
  source: MapAbleDataSource,
): void {
  const decision = evaluateOperationalIngestion(source);
  if (!decision.allowed) throw new Error(decision.reason);
}

export function validateProvenanceEnvelope(
  input: ProvenanceEnvelope,
): ProvenanceEnvelope {
  for (const [field, value] of [
    ["dataSourceId", input.dataSourceId],
    ["sourceRecordId", input.sourceRecordId],
    ["sourceUri", input.sourceUri],
    ["retrievedAt", input.retrievedAt],
    ["contentHash", input.contentHash],
  ] as const) {
    if (!value.trim()) throw new Error(`${field} is required`);
  }

  let parsedSource: URL;
  try {
    parsedSource = new URL(input.sourceUri);
  } catch {
    throw new Error("sourceUri must be an absolute URL");
  }
  if (parsedSource.protocol !== "https:" && parsedSource.protocol !== "http:") {
    throw new Error("sourceUri must use http or https");
  }

  if (Number.isNaN(Date.parse(input.retrievedAt))) {
    throw new Error("retrievedAt must be a valid ISO-compatible date");
  }
  if (input.observedAt && Number.isNaN(Date.parse(input.observedAt))) {
    throw new Error("observedAt must be a valid ISO-compatible date");
  }
  if (!input.contentHash.startsWith("sha256:")) {
    throw new Error("contentHash must use the sha256: prefix");
  }
  if (
    input.confidence != null &&
    (input.confidence < 0 || input.confidence > 1)
  ) {
    throw new Error("confidence must be between 0 and 1");
  }
  if (
    input.machineDerived &&
    input.verificationStatus === "INDEPENDENTLY_VERIFIED"
  ) {
    throw new Error(
      "Machine-derived evidence cannot mark itself independently verified",
    );
  }

  return { ...input };
}

export function classifyObservationChange(input: {
  existing?: ObservationFingerprint | null;
  incoming: ObservationFingerprint;
}): ObservationChange {
  const { existing, incoming } = input;
  if (!existing) return "CREATE";

  const sameSourceRecord =
    existing.dataSourceId === incoming.dataSourceId &&
    existing.sourceRecordId === incoming.sourceRecordId;

  if (sameSourceRecord) {
    return existing.contentHash === incoming.contentHash
      ? "DUPLICATE"
      : "SUPERSEDE";
  }

  if (
    existing.claimKey === incoming.claimKey &&
    existing.valueFingerprint !== incoming.valueFingerprint
  ) {
    return "CONFLICT";
  }

  return "CREATE";
}
