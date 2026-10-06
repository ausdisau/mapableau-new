export type AihwVersionInformation = {
  api_version: string;
  data_version: number;
  date_uploaded: string;
  requested_time_stamp: string;
};

export type AihwEnvelope<T> = {
  result: T;
  version_information: AihwVersionInformation;
};

export type AihwReportingUnitType = {
  reporting_unit_type_code: string;
  reporting_unit_type_name: string;
};

export type AihwMetaTagType = {
  meta_tag_type_code: string;
  meta_tag_type_name: string;
};

export type AihwMetaTag = {
  meta_tag_code: string;
  meta_tag_name: string;
  meta_tag_type: AihwMetaTagType;
};

export type AihwReportingUnitSummary = {
  reporting_unit_code: string;
  reporting_unit_name: string;
  reporting_unit_type: AihwReportingUnitType;
};

export type AihwMappedReportingUnit = {
  mapped_reporting_unit: AihwReportingUnitSummary;
  map_type: {
    mapped_reporting_unit_code: string;
    mapped_reporting_unit_name: string;
  };
};

export type AihwReportingUnit = {
  alternative_names: string[];
  closed: boolean;
  private: boolean;
  latitude: number | null;
  longitude: number | null;
  mapped_reporting_units: AihwMappedReportingUnit[];
  meta_tags: AihwMetaTag[];
  reporting_unit_code: string;
  reporting_unit_name: string;
  reporting_unit_type: AihwReportingUnitType;
};

export type AihwMeasureSummary = {
  measure_code: string;
  measure_name: string;
};

export type AihwCaveat = {
  caveat_code: string;
  caveat_name: string;
  caveat_display_value?: string | null;
  caveat_footnote?: string | null;
};

export type AihwDataItem = {
  caveats: AihwCaveat[];
  data_set_id: number;
  group_number?: number | null;
  lower_value?: number | null;
  measure_code: string;
  peer_group_summary?: AihwReportingUnitSummary | null;
  proxy_reporting_unit_summary?: AihwReportingUnitSummary | null;
  reported_measure_code: string;
  reporting_unit_summary: AihwReportingUnitSummary;
  upper_value?: number | null;
  value?: number | null;
};

export type AihwHospitalEvidenceProfile = {
  hospital: AihwReportingUnit;
  measures: AihwMeasureSummary[];
  source: {
    id: "aihw-myhospitals-api-v1";
    label: "AIHW MyHospitals API v1";
    attribution: "Source: Australian Institute of Health and Welfare.";
    sourceUri: "https://myhospitalsapi.aihw.gov.au/";
  };
  versionInformation: {
    hospital: AihwVersionInformation;
    measures: AihwVersionInformation;
  };
  claimControls: {
    accessibilityEvidence: "NOT_PROVIDED_BY_SOURCE";
    clinicalRecommendation: "NOT_SUPPORTED";
    liveCapacity: "NOT_SUPPORTED";
    universalQualityScore: "NOT_SUPPORTED";
  };
};
