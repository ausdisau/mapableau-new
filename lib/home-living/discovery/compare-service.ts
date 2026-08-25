import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import type {
  ComparisonRow,
  PublicPropertyDetail,
  RequirementMatchState,
} from "@/lib/home-living/contracts/property";
import { getPublishedPropertiesByIds } from "@/lib/home-living/discovery/property-discovery-service";
import { matchRequirementToEvidence } from "@/lib/home-living/evidence/evidence-normalizer";

export class HomeCompareDisabledError extends Error {
  constructor() {
    super("HOME_COMPARE_DISABLED");
    this.name = "HomeCompareDisabledError";
  }
}

function assertCompareEnabled() {
  if (
    !homeLivingConfig.enabled ||
    !homeLivingConfig.discoveryEnabled ||
    !homeLivingConfig.compareEnabled
  ) {
    throw new HomeCompareDisabledError();
  }
}

function cell(
  propertyId: string,
  display: string,
  matchState: RequirementMatchState,
): ComparisonRow["values"][number] {
  return { propertyId, display, matchState };
}

/** Side-by-side comparison of up to four published properties. No suitability score. */
export async function comparePublishedProperties(input: {
  propertyIds: string[];
  selectedRequirements?: string[];
}): Promise<{
  properties: PublicPropertyDetail[];
  rows: ComparisonRow[];
  guidance: string;
}> {
  assertCompareEnabled();
  const properties = await getPublishedPropertiesByIds(input.propertyIds);
  const requirements = (input.selectedRequirements ?? []).filter(Boolean);

  const factualRows: ComparisonRow[] = [
    {
      featureLabel: "Suburb / state",
      values: properties.map((p) =>
        cell(
          p.id,
          [p.suburb, p.state].filter(Boolean).join(", ") || "Unknown",
          "UNKNOWN",
        ),
      ),
    },
    {
      featureLabel: "Property type",
      values: properties.map((p) => cell(p.id, p.propertyType, "UNKNOWN")),
    },
    {
      featureLabel: "Bedrooms",
      values: properties.map((p) =>
        cell(
          p.id,
          p.bedroomCount == null ? "Unknown" : String(p.bedroomCount),
          "UNKNOWN",
        ),
      ),
    },
    {
      featureLabel: "Availability",
      values: properties.map((p) =>
        cell(p.id, p.availabilityStatus, "UNKNOWN"),
      ),
    },
    {
      featureLabel: "Open vacancies",
      values: properties.map((p) =>
        cell(p.id, String(p.openVacancyCount), "UNKNOWN"),
      ),
    },
    {
      featureLabel: "SDA category (metadata only)",
      values: properties.map((p) =>
        cell(p.id, p.sdaCategory ?? "Not stated", "UNKNOWN"),
      ),
    },
    {
      featureLabel: "Support provider independent",
      values: properties.map((p) =>
        cell(
          p.id,
          p.supportProviderIndependent ? "Yes" : "Related support noted",
          "UNKNOWN",
        ),
      ),
    },
    {
      featureLabel: "Evidence features recorded",
      values: properties.map((p) =>
        cell(p.id, String(p.evidenceFeatureCount), "UNKNOWN"),
      ),
    },
    {
      featureLabel: "Unknowns highlighted",
      values: properties.map((p) =>
        cell(
          p.id,
          p.unknowns.length ? p.unknowns.join("; ") : "None listed",
          p.unknowns.length ? "UNKNOWN" : "MEETS",
        ),
      ),
    },
  ];

  const requirementRows: ComparisonRow[] = requirements.map((requirement) => ({
    featureLabel: `Your requirement: ${requirement}`,
    values: properties.map((p) => {
      const matchState = matchRequirementToEvidence({
        requirement,
        evidence: p.evidence,
      });
      const display =
        matchState === "MEETS"
          ? "Meets (from recorded evidence)"
          : matchState === "DOES_NOT_MATCH"
            ? "Does not match recorded evidence"
            : matchState === "POSSIBLE_GAP"
              ? "Possible gap"
              : "Unknown — no matching evidence";
      return cell(p.id, display, matchState);
    }),
  }));

  return {
    properties,
    rows: [...factualRows, ...requirementRows],
    guidance:
      "These homes meet the requirements you selected in different ways. MapAble does not rank homes or decide suitability.",
  };
}
