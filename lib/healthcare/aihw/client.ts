import type { AihwEnvelope, AihwReportingUnit, AihwMeasureSummary, AihwDataItem } from "@/lib/healthcare/aihw/contracts";

const BASE = "https://myhospitalsapi.aihw.gov.au/";

async function get<T>(path: string): Promise<AihwEnvelope<T>> {
  const response = await fetch(new URL(path, BASE), {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`AIHW MyHospitals request failed: ${response.status}`);
  return (await response.json()) as AihwEnvelope<T>;
}

export function listAihwHospitals() {
  return get<AihwReportingUnit[]>("/api/v1/reporting-units?reporting_unit_type_code=H");
}

export function getAihwHospital(code: string) {
  return get<AihwReportingUnit>(`/api/v1/reporting-units/${encodeURIComponent(code)}`);
}

export function getAihwHospitalMeasures(code: string) {
  return get<AihwMeasureSummary[]>(`/api/v1/reporting-units/${encodeURIComponent(code)}/measures-available`);
}

export function getAihwHospitalDataItems(code: string) {
  return get<AihwDataItem[]>(`/api/v1/reporting-units/${encodeURIComponent(code)}/data-items`);
}
