import { getAihwHospital, getAihwHospitalMeasures } from "@/lib/healthcare/aihw/client";
import type { AihwHospitalEvidenceProfile } from "@/lib/healthcare/aihw/contracts";

export async function getAihwHospitalEvidenceProfile(code: string): Promise<AihwHospitalEvidenceProfile> {
  const [hospital, measures] = await Promise.all([
    getAihwHospital(code),
    getAihwHospitalMeasures(code),
  ]);
  if (hospital.result.reporting_unit_type.reporting_unit_type_code !== "H") {
    throw new Error("AIHW reporting unit is not a hospital");
  }
  return {
    hospital: hospital.result,
    measures: measures.result,
    source: {
      id: "aihw-myhospitals-api-v1",
      label: "AIHW MyHospitals API v1",
      attribution: "Source: Australian Institute of Health and Welfare.",
      sourceUri: "https://myhospitalsapi.aihw.gov.au/",
    },
    versionInformation: {
      hospital: hospital.version_information,
      measures: measures.version_information,
    },
    claimControls: {
      accessibilityEvidence: "NOT_PROVIDED_BY_SOURCE",
      clinicalRecommendation: "NOT_SUPPORTED",
      liveCapacity: "NOT_SUPPORTED",
      universalQualityScore: "NOT_SUPPORTED",
    },
  };
}
