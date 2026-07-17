import type { AssuranceFrameworkKind } from "@prisma/client";

/**
 * Concise internal control catalogues for readiness tracking.
 * NOT copyrighted standards text. MapAble is not certified by referencing these codes.
 */
export type CatalogueControl = {
  controlCode: string;
  title: string;
  objective: string;
  testingFrequency: string;
  evidenceFreshnessDays: number;
};

export type FrameworkCatalogue = {
  kind: AssuranceFrameworkKind;
  name: string;
  version: string;
  sourceLabel: string;
  scopeStatement: string;
  controls: CatalogueControl[];
};

export const ASSURANCE_CATALOGUES: FrameworkCatalogue[] = [
  {
    kind: "internal_baseline",
    name: "MapAble internal security baseline",
    version: "1.0",
    sourceLabel: "mapable_internal",
    scopeStatement:
      "Internal readiness controls for registration and go-live gates. Not a certification.",
    controls: [
      {
        controlCode: "IAM-01",
        title: "Access provisioning reviewed",
        objective: "Privileged and standard access are reviewed on a defined cadence.",
        testingFrequency: "quarterly",
        evidenceFreshnessDays: 90,
      },
      {
        controlCode: "CHG-01",
        title: "Change management gate",
        objective: "Production changes require documented approval before release.",
        testingFrequency: "per_release",
        evidenceFreshnessDays: 30,
      },
      {
        controlCode: "LOG-01",
        title: "Security logging retained",
        objective: "Security-relevant events are retained and reviewable.",
        testingFrequency: "monthly",
        evidenceFreshnessDays: 60,
      },
      {
        controlCode: "BCP-01",
        title: "Backup restore exercised",
        objective: "Backup restore capability is demonstrated periodically.",
        testingFrequency: "semi_annual",
        evidenceFreshnessDays: 180,
      },
    ],
  },
  {
    kind: "soc2_readiness",
    name: "SOC 2 readiness scaffold",
    version: "1.0",
    sourceLabel: "internal_readiness_scaffold",
    scopeStatement:
      "Readiness tracking only. MapAble is not SOC 2 certified by seeding these controls.",
    controls: [
      {
        controlCode: "CC6-ACCESS",
        title: "Logical access restrictions",
        objective: "Access to systems is limited to authorised roles.",
        testingFrequency: "quarterly",
        evidenceFreshnessDays: 90,
      },
      {
        controlCode: "CC7-MONITOR",
        title: "System monitoring",
        objective: "Anomalies and incidents are detected and triaged.",
        testingFrequency: "monthly",
        evidenceFreshnessDays: 45,
      },
    ],
  },
  {
    kind: "iso27001_readiness",
    name: "ISO 27001 readiness scaffold",
    version: "1.0",
    sourceLabel: "internal_readiness_scaffold",
    scopeStatement:
      "Readiness tracking only. MapAble is not ISO 27001 certified by seeding these controls.",
    controls: [
      {
        controlCode: "A.5-POLICY",
        title: "Information security policy",
        objective: "An approved information security policy is maintained.",
        testingFrequency: "annual",
        evidenceFreshnessDays: 365,
      },
      {
        controlCode: "A.8-ASSET",
        title: "Asset inventory",
        objective: "Information assets in scope are inventoried.",
        testingFrequency: "quarterly",
        evidenceFreshnessDays: 90,
      },
    ],
  },
  {
    kind: "ndia_digital_platform",
    name: "NDIA digital platform readiness scaffold",
    version: "1.0",
    sourceLabel: "internal_ndia_readiness",
    scopeStatement:
      "Internal readiness for a future formally approved NDIA digital partnership. No live submission.",
    controls: [
      {
        controlCode: "NDIA-AUTH-01",
        title: "External approval before direct adapter",
        objective:
          "Direct NDIA adapter activation requires documented external approval; otherwise blocked.",
        testingFrequency: "continuous",
        evidenceFreshnessDays: 30,
      },
      {
        controlCode: "NDIA-EVID-01",
        title: "Exact billable evidence linkage",
        objective:
          "Claim evidence bundles link only exact Wave 4 billable items and evidence packages.",
        testingFrequency: "per_bundle",
        evidenceFreshnessDays: 14,
      },
      {
        controlCode: "NDIA-REG-0137",
        title: "Registration group 0137 tracked",
        objective:
          "Digital platform registration pathway tracks group 0137 when applicable.",
        testingFrequency: "per_application",
        evidenceFreshnessDays: 90,
      },
    ],
  },
];
