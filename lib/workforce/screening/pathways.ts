import type { WorkerScreeningJurisdiction } from "@mapable/domain-workforce";

export type WorkerScreeningPathway = {
  jurisdiction: WorkerScreeningJurisdiction;
  unitName: string;
  officialUrl: string;
  nationalDatabaseUrl: string;
  notes: string[];
};

const NATIONAL_DATABASE_GUIDANCE_URL =
  "https://www.ndiscommission.gov.au/workforce/worker-screening";

const PATHWAYS: Record<WorkerScreeningJurisdiction, WorkerScreeningPathway> = {
  ACT: {
    jurisdiction: "ACT",
    unitName: "Access Canberra",
    officialUrl:
      "https://www.accesscanberra.act.gov.au/business-and-work/working-with-vulnerable-people",
    nationalDatabaseUrl: NATIONAL_DATABASE_GUIDANCE_URL,
    notes: ["Use the ACT worker screening unit for application and current-check details."],
  },
  NSW: {
    jurisdiction: "NSW",
    unitName: "Office of the Children's Guardian",
    officialUrl: "https://ocg.nsw.gov.au/ndiswc",
    nationalDatabaseUrl: NATIONAL_DATABASE_GUIDANCE_URL,
    notes: ["Use the NSW worker screening unit for application and current-check details."],
  },
  NT: {
    jurisdiction: "NT",
    unitName: "SAFE NT",
    officialUrl: "https://forms.pfes.nt.gov.au/safent/",
    nationalDatabaseUrl: NATIONAL_DATABASE_GUIDANCE_URL,
    notes: ["Use SAFE NT for NDIS worker screening applications and status enquiries."],
  },
  QLD: {
    jurisdiction: "QLD",
    unitName: "Disability Worker Screening Queensland",
    officialUrl: "https://www.workerscreening.qld.gov.au/",
    nationalDatabaseUrl: NATIONAL_DATABASE_GUIDANCE_URL,
    notes: ["Queensland does not permit work-on-application for NDIS risk-assessed roles."],
  },
  SA: {
    jurisdiction: "SA",
    unitName: "Department of Human Services Screening Unit",
    officialUrl:
      "https://www.sa.gov.au/topics/rights-and-law/rights-and-responsibilities/screening-checks",
    nationalDatabaseUrl: NATIONAL_DATABASE_GUIDANCE_URL,
    notes: ["South Australia does not permit work-on-application for NDIS risk-assessed roles."],
  },
  TAS: {
    jurisdiction: "TAS",
    unitName: "Department of Justice - Registration to Work with Vulnerable People",
    officialUrl: "https://www.justice.tas.gov.au/rwvp",
    nationalDatabaseUrl: NATIONAL_DATABASE_GUIDANCE_URL,
    notes: ["Use the Tasmanian worker screening unit for application and current-check details."],
  },
  VIC: {
    jurisdiction: "VIC",
    unitName: "Department of Justice and Community Safety Victoria",
    officialUrl: "https://www.vic.gov.au/ndis-worker-screening-check",
    nationalDatabaseUrl: NATIONAL_DATABASE_GUIDANCE_URL,
    notes: [
      "Victoria does not permit work-on-application for NDIS risk-assessed roles.",
      "MapAble's Victoria API adapter remains fail-closed until the authenticated API contract is available.",
    ],
  },
  WA: {
    jurisdiction: "WA",
    unitName: "Department of Communities WA",
    officialUrl:
      "https://www.wa.gov.au/organisation/department-of-communities/ndis-worker-screening-check",
    nationalDatabaseUrl: NATIONAL_DATABASE_GUIDANCE_URL,
    notes: ["Use the WA worker screening unit for application and current-check details."],
  },
};

export function getWorkerScreeningPathway(
  jurisdiction: WorkerScreeningJurisdiction,
): WorkerScreeningPathway {
  return PATHWAYS[jurisdiction];
}

export function listWorkerScreeningPathways(): WorkerScreeningPathway[] {
  return Object.values(PATHWAYS);
}
