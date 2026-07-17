/**
 * FICTIONAL development fixtures for Quality & Safeguards Ops Centre.
 * Never seed real participant information.
 *
 * Run: npx tsx prisma/seed-quality-safeguards.ts
 */
import { PrismaClient } from "@prisma/client";

import { ensureBuiltinDeadlineRules } from "../lib/quality-safeguards/deadline-engine";
import { createDeadlineInstance } from "../lib/quality-safeguards/deadline-engine";
import { REGULATORY_PROFILE_JULY_2026 } from "../lib/quality-safeguards/regulatory-config";

const prisma = new PrismaClient();

const FICTIONAL_PREFIX = "[FICTIONAL FIXTURE]";

async function main() {
  console.log("Seeding fictional Quality & Safeguards fixtures…");

  await ensureBuiltinDeadlineRules();

  const existingProfile = await prisma.qsRegulatoryProfileConfig.findFirst({
    where: {
      code: REGULATORY_PROFILE_JULY_2026.code,
      version: REGULATORY_PROFILE_JULY_2026.version,
      organisationId: null,
    },
  });
  if (!existingProfile) {
    await prisma.qsRegulatoryProfileConfig.create({
      data: {
        organisationId: null,
        code: REGULATORY_PROFILE_JULY_2026.code,
        version: REGULATORY_PROFILE_JULY_2026.version,
        jurisdiction: REGULATORY_PROFILE_JULY_2026.jurisdiction,
        profileJson: REGULATORY_PROFILE_JULY_2026,
        active: true,
      },
    });
  } else {
    await prisma.qsRegulatoryProfileConfig.update({
      where: { id: existingProfile.id },
      data: {
        profileJson: REGULATORY_PROFILE_JULY_2026,
        active: true,
      },
    });
  }

  const org =
    (await prisma.organisation.findFirst({
      where: { status: "active" },
      select: { id: true, name: true },
    })) ??
    (await prisma.organisation.create({
      data: {
        name: `${FICTIONAL_PREFIX} Demo Care Provider`,
        organisationType: "care_provider",
        contactEmail: "fictional-qsc@example.invalid",
      },
      select: { id: true, name: true },
    }));

  const fixtures: Array<{
    id: string;
    sourceType:
      | "care_shift"
      | "transport_trip"
      | "anonymous"
      | "credential"
      | "incident"
      | "system_rule"
      | "complaint"
      | "participant_report";
    summary: string;
    urgency: "critical" | "high" | "moderate" | "low";
    immediateSafetyConcern: boolean;
    serviceVertical: "care" | "transport" | "jobs" | "core";
    isAnonymous?: boolean;
  }> = [
    {
      id: "qs-fixture-missed-shift",
      sourceType: "care_shift",
      summary: `${FICTIONAL_PREFIX} Missed Care shift — no participant harm reported (demo).`,
      urgency: "moderate",
      immediateSafetyConcern: false,
      serviceVertical: "care",
    },
    {
      id: "qs-fixture-stranded-trip",
      sourceType: "transport_trip",
      summary: `${FICTIONAL_PREFIX} Participant stranded after accessible vehicle cancellation (demo).`,
      urgency: "critical",
      immediateSafetyConcern: true,
      serviceVertical: "transport",
    },
    {
      id: "qs-fixture-anon-complaint",
      sourceType: "anonymous",
      summary: `${FICTIONAL_PREFIX} Anonymous complaint about disrespectful communication (demo).`,
      urgency: "high",
      immediateSafetyConcern: false,
      serviceVertical: "core",
      isAnonymous: true,
    },
    {
      id: "qs-fixture-credential-7d",
      sourceType: "credential",
      summary: `${FICTIONAL_PREFIX} Worker credential expiring in seven days (demo).`,
      urgency: "high",
      immediateSafetyConcern: false,
      serviceVertical: "core",
    },
    {
      id: "qs-fixture-serious-injury",
      sourceType: "incident",
      summary: `${FICTIONAL_PREFIX} Serious injury requiring urgent reportability review (demo).`,
      urgency: "critical",
      immediateSafetyConcern: true,
      serviceVertical: "care",
    },
    {
      id: "qs-fixture-neglect-allegation",
      sourceType: "incident",
      summary: `${FICTIONAL_PREFIX} Allegation of neglect requiring safeguarding controls (demo).`,
      urgency: "critical",
      immediateSafetyConcern: true,
      serviceVertical: "care",
    },
    {
      id: "qs-fixture-urp-no-harm",
      sourceType: "system_rule",
      summary: `${FICTIONAL_PREFIX} Unauthorised restrictive-practice event with no immediate harm (demo).`,
      urgency: "high",
      immediateSafetyConcern: false,
      serviceVertical: "care",
    },
    {
      id: "qs-fixture-recurring-complaint",
      sourceType: "complaint",
      summary: `${FICTIONAL_PREFIX} Recurring complaint pattern — candidate for CAPA (demo).`,
      urgency: "moderate",
      immediateSafetyConcern: false,
      serviceVertical: "core",
    },
    {
      id: "qs-fixture-audit-gap",
      sourceType: "system_rule",
      summary: `${FICTIONAL_PREFIX} Audit with missing evidence mapped to Practice Standards (demo).`,
      urgency: "moderate",
      immediateSafetyConcern: false,
      serviceVertical: "core",
    },
    {
      id: "qs-fixture-aac-feedback",
      sourceType: "participant_report",
      summary: `${FICTIONAL_PREFIX} Participant used AAC to submit feedback (demo).`,
      urgency: "low",
      immediateSafetyConcern: false,
      serviceVertical: "care",
    },
  ];

  const now = new Date();
  for (const fixture of fixtures) {
    await prisma.safeguardSignal.upsert({
      where: { id: fixture.id },
      create: {
        id: fixture.id,
        organisationId: org.id,
        sourceType: fixture.sourceType,
        sourceId: `fixture:${fixture.id}`,
        summary: fixture.summary,
        observedAt: now,
        urgency: fixture.urgency,
        immediateSafetyConcern: fixture.immediateSafetyConcern,
        serviceVertical: fixture.serviceVertical,
        isAnonymous: fixture.isAnonymous ?? false,
        status: "new",
        ruleTriggers: [
          {
            code: "fictional_seed",
            version: "2026-07",
            triggeredAt: now.toISOString(),
            advisory: true,
            summary: "Fictional development fixture — not production evidence",
            suggestedAction: "Use for local demo only",
          },
        ],
      },
      update: {
        summary: fixture.summary,
        urgency: fixture.urgency,
        immediateSafetyConcern: fixture.immediateSafetyConcern,
      },
    });
  }

  await createDeadlineInstance({
    organisationId: org.id,
    ruleCode: "credential_expiry_warning_7d",
    ruleVersion: "2026-07",
    resourceType: "worker_credential",
    resourceId: "qs-fixture-credential-7d",
    triggerEvent: "credential.expiring",
    triggeredAt: now,
    metadata: { fictional: true },
  });

  await createDeadlineInstance({
    organisationId: org.id,
    ruleCode: "reportable_incident_24h",
    ruleVersion: "2026-07",
    resourceType: "safeguard_signal",
    resourceId: "qs-fixture-serious-injury",
    triggerEvent: "incident.awareness",
    triggeredAt: now,
    metadata: { fictional: true },
  });

  console.log(
    `Seeded ${fixtures.length} fictional signals for organisation ${org.name} (${org.id}).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
