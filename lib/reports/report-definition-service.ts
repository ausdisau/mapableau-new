import type { ReportCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const REPORT_DEFINITIONS: Array<{
  reportKey: string;
  title: string;
  description: string;
  category: ReportCategory;
  deidentified: boolean;
}> = [
  {
    reportKey: "participant_activity",
    title: "Participant activity",
    description: "Bookings, consent changes, and document activity counts for a participant.",
    category: "participant_activity",
    deidentified: false,
  },
  {
    reportKey: "provider_operations",
    title: "Provider operations",
    description: "Organisation-scoped operational metrics: shifts, workers, bookings.",
    category: "provider_operations",
    deidentified: false,
  },
  {
    reportKey: "care_delivery",
    title: "Care delivery",
    description: "Care request and shift completion aggregates.",
    category: "care_delivery",
    deidentified: false,
  },
  {
    reportKey: "transport_delivery",
    title: "Transport delivery",
    description: "Transport booking completion and status aggregates.",
    category: "transport_delivery",
    deidentified: false,
  },
  {
    reportKey: "employment_outcomes",
    title: "Employment outcomes",
    description: "Job applications and placement counts.",
    category: "employment_outcomes",
    deidentified: false,
  },
  {
    reportKey: "marketplace_activity",
    title: "Marketplace activity",
    description: "Provider search and booking funnel aggregates.",
    category: "marketplace_activity",
    deidentified: true,
  },
  {
    reportKey: "food_delivery",
    title: "Food delivery",
    description: "Food delivery order aggregates where configured.",
    category: "food_delivery",
    deidentified: false,
  },
  {
    reportKey: "billing_finance",
    title: "Billing and finance",
    description: "Invoice status summaries and reconciliation metrics.",
    category: "billing_finance",
    deidentified: false,
  },
  {
    reportKey: "plan_manager_review",
    title: "Plan manager review",
    description: "Plan-managed invoice and funding review aggregates.",
    category: "plan_manager_review",
    deidentified: false,
  },
  {
    reportKey: "quality_safeguards",
    title: "Quality and safeguards",
    description: "Incident and complaint counts by severity — no narratives.",
    category: "quality_safeguards",
    deidentified: false,
  },
  {
    reportKey: "privacy_security",
    title: "Privacy and security",
    description: "Data access and breach register summary metrics.",
    category: "privacy_security",
    deidentified: false,
  },
  {
    reportKey: "peer_community",
    title: "Peer community",
    description: "Community engagement aggregates.",
    category: "peer_community",
    deidentified: true,
  },
  {
    reportKey: "access_map",
    title: "Access map",
    description: "Accessibility place report and review aggregates.",
    category: "access_map",
    deidentified: true,
  },
  {
    reportKey: "board_pack",
    title: "Board pack",
    description: "De-identified board reporting pack with low-count suppression.",
    category: "board_pack",
    deidentified: true,
  },
];

export async function seedReportDefinitions(): Promise<number> {
  let created = 0;
  for (const def of REPORT_DEFINITIONS) {
    await prisma.reportDefinition.upsert({
      where: { reportKey: def.reportKey },
      create: {
        reportKey: def.reportKey,
        title: def.title,
        description: def.description,
        category: def.category,
        deidentified: def.deidentified,
        active: true,
      },
      update: {
        title: def.title,
        description: def.description,
        category: def.category,
        deidentified: def.deidentified,
        active: true,
      },
    });
    created++;
  }
  return created;
}

export async function listReportDefinitions(activeOnly = true) {
  return prisma.reportDefinition.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { title: "asc" },
  });
}

export async function getReportDefinitionByKey(reportKey: string) {
  return prisma.reportDefinition.findUnique({
    where: { reportKey },
  });
}
