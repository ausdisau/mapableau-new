/**
 * Coverage Care synthetic seed (local / pilot only).
 *
 * Seeds Coverage Care + fictional Acme Care tenants, brand kit, and demo listings.
 * Does not claim verified NDIS registration or live availability.
 *
 * Usage (local):
 *   MAPABLE_COVERAGE_CARE_ENABLED=true npx tsx prisma/seed-coverage-care.ts
 *
 * Do not run against production.
 */

import { PrismaClient } from "@prisma/client";

import { COVERAGE_CARE_BRAND } from "../lib/coverage-care/brand";
import {
  ACME_CARE_TENANT_SLUG,
  COVERAGE_CARE_TENANT_SLUG,
} from "../lib/coverage-care/types";

const prisma = new PrismaClient();

async function upsertTenant(slug: string, name: string) {
  return prisma.tenant.upsert({
    where: { slug },
    create: { slug, name, status: "active" },
    update: { name, status: "active" },
  });
}

async function main() {
  const coverage = await upsertTenant(
    COVERAGE_CARE_TENANT_SLUG,
    COVERAGE_CARE_BRAND.name,
  );
  const acme = await upsertTenant(
    ACME_CARE_TENANT_SLUG,
    "Acme Care (fictional isolation tenant)",
  );

  await prisma.coverageCareTenantBrand.upsert({
    where: { tenantId: coverage.id },
    create: {
      tenantId: coverage.id,
      colorsJson: {
        sage: COVERAGE_CARE_BRAND.sage,
        olive: COVERAGE_CARE_BRAND.olive,
      },
      logoSvg: "organic-wave",
      messagingJson: {
        tagline: COVERAGE_CARE_BRAND.tagline,
        values: [...COVERAGE_CARE_BRAND.values],
      },
      approvalStatus: "approved",
    },
    update: {
      colorsJson: {
        sage: COVERAGE_CARE_BRAND.sage,
        olive: COVERAGE_CARE_BRAND.olive,
      },
      messagingJson: {
        tagline: COVERAGE_CARE_BRAND.tagline,
        values: [...COVERAGE_CARE_BRAND.values],
      },
      approvalStatus: "approved",
    },
  });

  const existingCoverage = await prisma.coverageCareServiceListing.count({
    where: { tenantId: coverage.id },
  });
  if (existingCoverage === 0) {
    await prisma.coverageCareServiceListing.createMany({
      data: [
        {
          tenantId: coverage.id,
          title: "Community Occupational Therapy (demo)",
          discipline: "Occupational Therapy",
          region: "Greater Sydney (synthetic)",
          accessibilityNotes:
            "Wheelchair-accessible clinic rooms. AAC-friendly communication available on request.",
          summary:
            "Synthetic allied-health listing for Coverage Care pilot. Not a live provider.",
          provenance: "synthetic_demo",
        },
        {
          tenantId: coverage.id,
          title: "Speech Pathology — home & telehealth (demo)",
          discipline: "Speech Pathology",
          region: "Illawarra (synthetic)",
          accessibilityNotes:
            "Telehealth and home-visit options. Easy-read materials available.",
          summary:
            "Demo speech pathology directory entry. Availability and registration are not verified.",
          provenance: "synthetic_demo",
        },
        {
          tenantId: coverage.id,
          title: "Physiotherapy & mobility support (demo)",
          discipline: "Physiotherapy",
          region: "Hunter (synthetic)",
          accessibilityNotes: "Step-free entry. Quiet waiting room option.",
          summary:
            "Synthetic physiotherapy listing. Do not treat as confirmed NDIS registration.",
          provenance: "synthetic_demo",
        },
      ],
    });
  }

  const existingAcme = await prisma.coverageCareServiceListing.count({
    where: { tenantId: acme.id },
  });
  if (existingAcme === 0) {
    await prisma.coverageCareServiceListing.create({
      data: {
        tenantId: acme.id,
        title: "Acme OT (other tenant — isolation fixture)",
        discipline: "Occupational Therapy",
        region: "Melbourne (synthetic)",
        accessibilityNotes: "Isolation test fixture only.",
        summary: "Belongs to fictional second tenant acme-care.",
        provenance: "synthetic_demo",
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        coverageTenantId: coverage.id,
        acmeTenantId: acme.id,
        note: "Synthetic seed complete. Pilot only — no production claims.",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
