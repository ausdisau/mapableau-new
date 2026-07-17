import type { DisclosureManifest } from "@prisma/client";

export interface FhirProvenance {
  resourceType: "Provenance";
  recorded: string;
  agent: Array<{
    type: { coding: [{ system: string; code: string }] };
    who: { identifier: { system: string; value: string } };
  }>;
  activity?: { coding: [{ system: string; code: string; display: string }] };
  meta: {
    source: "https://mapable.com.au/disclosure";
    tag: Array<{ system: string; code: string }>;
  };
}

export function disclosureToFhirProvenance(
  manifest: DisclosureManifest
): FhirProvenance {
  return {
    resourceType: "Provenance",
    recorded: manifest.createdAt.toISOString(),
    agent: [
      {
        type: {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
              code: "author",
            },
          ],
        },
        who: {
          identifier: {
            system: "https://mapable.com.au/subject",
            value: `pairwise:${manifest.subjectId}`,
          },
        },
      },
    ],
    activity: {
      coding: [
        {
          system: "https://mapable.com.au/activity",
          code: "external_disclosure",
          display: manifest.purposeSummary,
        },
      ],
    },
    meta: {
      source: "https://mapable.com.au/disclosure",
      tag: [
        {
          system: "https://mapable.com.au/tags",
          code: manifest.simulator ? "simulator" : "production",
        },
      ],
    },
  };
}
