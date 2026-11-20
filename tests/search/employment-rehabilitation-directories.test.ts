import { describe, expect, it } from "vitest";

import {
  categoryAllowsSource,
  categoriesForDomain,
  directoryCategory,
  directoryRoute,
  domainForCategory,
  isValidCategoryFilter,
} from "@/lib/search/domain-directory-taxonomy";
import {
  MAPABLE_ONE_OPERATIONS,
  oneCapabilitiesByDomain,
  oneCapabilitySummary,
} from "@/lib/one/operations-registry";
import { importedProviderHits, navigationSearch } from "@/lib/search/mapable-search-core";

describe("MapAble Employment and Rehabilitation directories", () => {
  it("exposes a distinct rehabilitation vertical and source-labelled module", () => {
    const hits = navigationSearch({ q: "physiotherapy", vertical: "rehabilitation" });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.href).toBe("/moves/directory");
    expect(hits[0]?.registration).toBe("not_independently_verified");
    expect(hits[0]?.accessFit).toBe("unknown");
  });

  it("contains separate published job, adjustments and employment service categories", () => {
    const names = categoriesForDomain("jobs").map((item) => item.id);
    expect(names).toContain("job_vacancies");
    expect(names).toContain("employment_support");
    expect(names).toContain("workplace_adjustments");
    expect(categoryAllowsSource(directoryCategory("jobs", "job_vacancies"), "providers")).toBe(false);
    expect(categoryAllowsSource(directoryCategory("jobs", "employment_support"), "jobs")).toBe(false);
  });

  it("never treats one profession's service code as all rehabilitation disciplines", () => {
    const speech = directoryCategory("rehabilitation", "speech_pathology");
    expect(speech.serviceLabels).toEqual(["Speech Pathologist"]);
    expect(speech.registrationGroups).toEqual([]);
    const physio = directoryCategory("rehabilitation", "physiotherapy");
    expect(physio.serviceLabels).toEqual(["Physiotherapist"]);
    expect(physio.registrationGroups).toEqual([]);
    expect(directoryCategory("rehabilitation", "not-a-category").id).toBe("all");
  });

  it("rejects mixing filters across programme verticals", () => {
    expect(domainForCategory("speech_pathology")).toBe("rehabilitation");
    expect(domainForCategory("job_vacancies")).toBe("jobs");
    expect(isValidCategoryFilter("jobs", "physiotherapy")).toBe(false);
    expect(isValidCategoryFilter("rehabilitation", "job_vacancies")).toBe(false);
    expect(isValidCategoryFilter("all", "speech_pathology")).toBe(true);
    expect(isValidCategoryFilter("jobs", undefined)).toBe(true);
  });

  it("links specialist filters to independent accessible directory routes", () => {
    expect(directoryRoute("jobs")).toBe("/employment/directory");
    expect(directoryRoute("rehabilitation")).toBe("/moves/directory");
  });

  it("does not turn imported outlet data into verification or availability", () => {
    const [hit] = importedProviderHits([{
      source_id: "outlet-source-001",
      provider_name: "Example Therapy Outlet",
      suburb: "Sydney", state: "NSW", postcode: "2000",
      services: ["Therapeutic Supports"],
    }]);
    expect(hit?.provenance).toBe("local_ndis_directory_import");
    expect(hit?.workerScreening).toBe("not_independently_verified");
    expect(hit?.registration).toBe("not_independently_verified");
    expect(hit?.availability).toBe("unknown");
  });
});

describe("MapAble One native capability boundaries", () => {
  it("keeps planned features unlinked rather than presenting fake operational routes", () => {
    const planned = MAPABLE_ONE_OPERATIONS.filter((item) => item.stage === "planned");
    expect(planned.length).toBeGreaterThanOrEqual(3);
    expect(planned.every((item) => item.existingRoute === undefined)).toBe(true);
  });

  it("retains separate workforce, practice, employment and finance capability groups", () => {
    for (const domain of ["workforce", "practice", "employment", "finance"] as const) {
      expect(oneCapabilitiesByDomain(domain).length).toBeGreaterThanOrEqual(2);
    }
    const totals = oneCapabilitySummary();
    expect(totals.existing + totals.preview + totals.planned).toBe(MAPABLE_ONE_OPERATIONS.length);
  });

  it("requires caution for each feature and does not equate discovery with bookings", () => {
    expect(MAPABLE_ONE_OPERATIONS.every((item) => item.caution.length > 20)).toBe(true);
    const jobsDirectory = MAPABLE_ONE_OPERATIONS.find((item) => item.id === "employment-market");
    expect(jobsDirectory?.stage).toBe("directory_preview");
    const clinicWaitlist = MAPABLE_ONE_OPERATIONS.find((item) => item.id === "practice-waitlist");
    expect(clinicWaitlist?.stage).toBe("planned");
  });
});
