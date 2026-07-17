import {
  AccountabilityCommitmentStatus,
  AccountabilityMetricUnit,
  AccountabilityPublicationStatus,
  AccountabilitySensitivity,
  PrismaClient,
} from "@prisma/client";

import { hashPublicationPackage } from "../lib/accountability/snapshot-hash";

const prisma = new PrismaClient();

function assertDemoSeedAllowed(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Accountability demonstration seed is blocked in production. Never seed invented pilot outcomes into production."
    );
  }
  if (process.env.ALLOW_ACCOUNTABILITY_DEMO_SEED === "false") {
    throw new Error("ALLOW_ACCOUNTABILITY_DEMO_SEED=false — demo seed aborted.");
  }
}

export async function seedAccountabilityDemo() {
  assertDemoSeedAllowed();
  console.log("Seeding Accountability Portal demonstration data...");

  await prisma.accountabilityDisclosurePolicy.upsert({
    where: { policyKey: "default_public" },
    create: {
      policyKey: "default_public",
      name: "Default public cohort threshold",
      sensitivity: AccountabilitySensitivity.public,
      minimumCohortSize: 10,
      notes: "Default PUBLIC_COHORT_THRESHOLD = 10",
    },
    update: {
      minimumCohortSize: 10,
      isActive: true,
    },
  });

  const methodology = await prisma.accountabilityMethodology.upsert({
    where: { publicCode: "svc-fulfilment-v1" },
    create: {
      publicCode: "svc-fulfilment-v1",
      title: "Service fulfilment rate",
      plainLanguage:
        "Share of requested support shifts that were confirmed and delivered in the reporting period. Participant-initiated cancellations are reported separately and are not counted as MapAble service failure without context.",
      technicalNotes:
        "Numerator: fulfilled shifts. Denominator: requested shifts minus participant cancellations marked out-of-scope. Cohort suppression applies below 10.",
      version: "1",
      ownerRole: "metric_owner",
    },
    update: {},
  });

  const transportMethodology = await prisma.accountabilityMethodology.upsert({
    where: { publicCode: "transport-ontime-v1" },
    create: {
      publicCode: "transport-ontime-v1",
      title: "Transport on-time rate",
      plainLanguage:
        "Share of completed journeys where pickup occurred within the published punctuality window. Uses final validated reporting data, not live dispatch feeds.",
      technicalNotes:
        "Validated trip completions only. Small regions are generalised when below cohort threshold.",
      version: "1",
      ownerRole: "metric_owner",
    },
    update: {},
  });

  const metrics = [
    {
      publicCode: "services_delivered",
      name: "Services delivered",
      description: "Count of fulfilled care and support services in the period.",
      domain: "performance",
      unit: AccountabilityMetricUnit.count,
      methodologyId: methodology.id,
      numeratorDefinition: "Fulfilled service events",
      denominatorDefinition: null as string | null,
    },
    {
      publicCode: "service_fulfilment_rate",
      name: "Service fulfilment rate",
      description: "Fulfilled shifts as a share of in-scope requested shifts.",
      domain: "care",
      unit: AccountabilityMetricUnit.percentage,
      methodologyId: methodology.id,
      numeratorDefinition: "Fulfilled shifts",
      denominatorDefinition: "In-scope requested shifts",
    },
    {
      publicCode: "transport_ontime_rate",
      name: "Transport on-time rate",
      description: "Completed journeys pickup within punctuality window.",
      domain: "transport",
      unit: AccountabilityMetricUnit.percentage,
      methodologyId: transportMethodology.id,
      numeratorDefinition: "On-time completed journeys",
      denominatorDefinition: "Completed journeys",
    },
    {
      publicCode: "complaints_received",
      name: "Participant complaints received",
      description: "Complaints received through accessible channels.",
      domain: "complaints",
      unit: AccountabilityMetricUnit.count,
      methodologyId: methodology.id,
      numeratorDefinition: "Complaints received",
      denominatorDefinition: null,
    },
    {
      publicCode: "median_complaint_response_hours",
      name: "Median complaint response time",
      description: "Median hours to first substantive response.",
      domain: "complaints",
      unit: AccountabilityMetricUnit.duration,
      methodologyId: methodology.id,
      numeratorDefinition: null,
      denominatorDefinition: null,
    },
    {
      publicCode: "safeguarding_escalated",
      name: "Safeguarding matters escalated",
      description: "Matters escalated after triage in the period.",
      domain: "quality-safeguards",
      unit: AccountabilityMetricUnit.count,
      methodologyId: methodology.id,
      numeratorDefinition: "Escalated matters",
      denominatorDefinition: null,
    },
    {
      publicCode: "accessibility_reports_verified",
      name: "Accessibility reports verified",
      description: "Community or assessor reports verified in the period.",
      domain: "accessibility",
      unit: AccountabilityMetricUnit.count,
      methodologyId: methodology.id,
      numeratorDefinition: "Verified reports",
      denominatorDefinition: null,
    },
    {
      publicCode: "commitments_on_track",
      name: "Public commitments on track",
      description: "Commitments with status in_progress or completed versus active commitments.",
      domain: "commitments",
      unit: AccountabilityMetricUnit.percentage,
      methodologyId: methodology.id,
      numeratorDefinition: "On-track commitments",
      denominatorDefinition: "Active commitments",
    },
    {
      publicCode: "participant_corrections_completed",
      name: "Participant-requested corrections completed",
      description: "Published correction requests completed in the period.",
      domain: "corrections",
      unit: AccountabilityMetricUnit.count,
      methodologyId: methodology.id,
      numeratorDefinition: "Completed corrections",
      denominatorDefinition: null,
    },
  ];

  for (const metric of metrics) {
    await prisma.accountabilityMetric.upsert({
      where: { publicCode: metric.publicCode },
      create: {
        ...metric,
        sensitivity: AccountabilitySensitivity.public,
        minimumCohortSize: 10,
        updateFrequency: "quarterly",
        ownerRole: "metric_owner",
        isDemonstration: true,
      },
      update: {
        name: metric.name,
        description: metric.description,
        isDemonstration: true,
      },
    });
  }

  const periodStart = new Date("2026-01-01T00:00:00.000Z");
  const periodEnd = new Date("2026-03-31T23:59:59.000Z");

  const packageJson = {
    title: "Q1 2026 demonstration accountability snapshot",
    reportingPeriodStart: periodStart.toISOString(),
    reportingPeriodEnd: periodEnd.toISOString(),
    improvements: [
      {
        id: "imp-demo-1",
        title: "Clearer transport delay notices",
        summary:
          "After recurring feedback about late pickups, MapAble published plain-language delay notices and a replacement-ride escalation path.",
        sourceLabel: "Participant feedback (de-identified)",
      },
    ],
    metrics: {
      services_delivered: 1280,
      service_fulfilment_rate: 94.2,
      transport_ontime_rate: 91.5,
    },
  };

  const contentSha256 = hashPublicationPackage(packageJson);

  const existing = await prisma.accountabilityPublicationSnapshot.findFirst({
    where: { title: packageJson.title, isDemonstration: true },
  });

  const snapshot =
    existing ??
    (await prisma.accountabilityPublicationSnapshot.create({
      data: {
        title: packageJson.title,
        reportingPeriodStart: periodStart,
        reportingPeriodEnd: periodEnd,
        status: AccountabilityPublicationStatus.published,
        packageJson,
        contentSha256,
        dataCompletenessPct: 96,
        hasMajorCorrection: true,
        hasUnresolvedCriticalCommitment: true,
        isDemonstration: true,
        preparedById: "seed-preparer",
        publishedAt: new Date("2026-04-10T00:00:00.000Z"),
      },
    }));

  if (existing) {
    await prisma.accountabilityPublicationSnapshot.update({
      where: { id: existing.id },
      data: {
        packageJson,
        contentSha256,
        status: AccountabilityPublicationStatus.published,
        publishedAt: existing.publishedAt ?? new Date("2026-04-10T00:00:00.000Z"),
      },
    });
  }

  const metricRows = await prisma.accountabilityMetric.findMany({
    where: { isDemonstration: true },
  });

  const valueSeed: Record<
    string,
    {
      value: number;
      numerator?: number;
      denominator?: number;
      target?: number;
      previousValue?: number;
      sampleSize: number;
      summary: string;
      trend: string;
    }
  > = {
    services_delivered: {
      value: 1280,
      numerator: 1280,
      target: 1200,
      previousValue: 1190,
      sampleSize: 1280,
      summary: "1,280 services were delivered in the reporting period.",
      trend: "Increased compared with the previous period.",
    },
    service_fulfilment_rate: {
      value: 94.2,
      numerator: 1206,
      denominator: 1280,
      target: 95,
      previousValue: 93.1,
      sampleSize: 1280,
      summary: "94.2% of in-scope requested shifts were fulfilled.",
      trend: "Improved on the previous period but below the 95% target.",
    },
    transport_ontime_rate: {
      value: 91.5,
      numerator: 732,
      denominator: 800,
      target: 92,
      previousValue: 90.2,
      sampleSize: 800,
      summary: "91.5% of completed journeys met the on-time window.",
      trend: "Slight improvement; still just below target.",
    },
    complaints_received: {
      value: 42,
      numerator: 42,
      previousValue: 38,
      sampleSize: 42,
      summary: "42 participant complaints were received through accessible channels.",
      trend: "Slight increase; categories published in complaints section when available.",
    },
    median_complaint_response_hours: {
      value: 18,
      target: 24,
      previousValue: 22,
      sampleSize: 42,
      summary: "Median first response time was 18 hours.",
      trend: "Faster than the previous period and within the 24-hour target.",
    },
    safeguarding_escalated: {
      value: 11,
      numerator: 11,
      sampleSize: 11,
      summary: "11 safeguarding matters were escalated after triage.",
      trend: "Counts are reported, not allegations treated as facts.",
    },
    accessibility_reports_verified: {
      value: 156,
      numerator: 156,
      target: 150,
      previousValue: 140,
      sampleSize: 156,
      summary: "156 accessibility reports were verified.",
      trend: "Above target for the period.",
    },
    commitments_on_track: {
      value: 66.7,
      numerator: 2,
      denominator: 3,
      target: 80,
      sampleSize: 3,
      summary: "Two of three active public commitments are on track.",
      trend: "One delayed commitment remains visible with explanation.",
    },
    participant_corrections_completed: {
      value: 7,
      numerator: 7,
      sampleSize: 7,
      summary:
        "Not published because the group is too small to protect privacy.",
      trend: "Suppressed in public view when below cohort threshold.",
    },
  };

  for (const metric of metricRows) {
    const seed = valueSeed[metric.publicCode];
    if (!seed) continue;
    const suppressed =
      metric.publicCode === "participant_corrections_completed" ||
      (seed.sampleSize > 0 && seed.sampleSize < metric.minimumCohortSize);

    await prisma.accountabilityMetricValue.upsert({
      where: {
        publicId: `demo-value-${metric.publicCode}`,
      },
      create: {
        publicId: `demo-value-${metric.publicCode}`,
        metricId: metric.id,
        snapshotId: snapshot.id,
        reportingPeriodStart: periodStart,
        reportingPeriodEnd: periodEnd,
        value: suppressed ? null : seed.value,
        numerator: suppressed ? null : seed.numerator,
        denominator: suppressed ? null : seed.denominator,
        target: seed.target,
        previousValue: seed.previousValue,
        sampleSize: seed.sampleSize,
        completenessPercentage: 96,
        status: AccountabilityPublicationStatus.published,
        suppressionReason: suppressed
          ? "Not published because the group is too small to protect privacy."
          : null,
        accessibleSummary: seed.summary,
        trendDescription: seed.trend,
        isDemonstration: true,
      },
      update: {
        value: suppressed ? null : seed.value,
        numerator: suppressed ? null : seed.numerator,
        denominator: suppressed ? null : seed.denominator,
        status: AccountabilityPublicationStatus.published,
        suppressionReason: suppressed
          ? "Not published because the group is too small to protect privacy."
          : null,
        accessibleSummary: seed.summary,
        isDemonstration: true,
      },
    });
  }

  await prisma.accountabilityPublicationApproval.deleteMany({
    where: { snapshotId: snapshot.id },
  });
  await prisma.accountabilityPublicationApproval.createMany({
    data: [
      {
        snapshotId: snapshot.id,
        stage: "prepare",
        decision: "prepared",
        actorUserId: "seed-preparer",
      },
      {
        snapshotId: snapshot.id,
        stage: "privacy_review",
        decision: "approved",
        actorUserId: "seed-privacy-reviewer",
      },
      {
        snapshotId: snapshot.id,
        stage: "safeguarding_review",
        decision: "approved",
        actorUserId: "seed-safeguarding-reviewer",
      },
      {
        snapshotId: snapshot.id,
        stage: "approve",
        decision: "approved",
        actorUserId: "seed-approver",
      },
      {
        snapshotId: snapshot.id,
        stage: "publish",
        decision: "published",
        actorUserId: "seed-publisher",
      },
    ],
  });

  const existingEvidence = await prisma.accountabilityEvidenceItem.findFirst({
    where: {
      snapshotId: snapshot.id,
      publicCitationLabel: "Demo aggregate extract Q1 2026",
    },
  });
  if (!existingEvidence) {
    await prisma.accountabilityEvidenceItem.create({
      data: {
        publicCitationLabel: "Demo aggregate extract Q1 2026",
        evidenceType: "operational_aggregate_query",
        sourceSystem: "accountability_publication_layer",
        sourceOwner: "metric_owner",
        collectionDate: periodEnd,
        reportingPeriodStart: periodStart,
        reportingPeriodEnd: periodEnd,
        checksum: contentSha256,
        accessClassification: "public_citation",
        publicAvailability: true,
        snapshotId: snapshot.id,
        isDemonstration: true,
      },
    });
  }

  await prisma.accountabilityCommitment.upsert({
    where: { slug: "publish-quarterly-accountability-pack" },
    create: {
      slug: "publish-quarterly-accountability-pack",
      title: "Publish a quarterly accountability pack",
      plainLanguage:
        "MapAble will publish a quarterly privacy-safe accountability pack covering service reliability, complaints and commitments.",
      accountableBody: "Executive leadership",
      serviceVertical: "platform",
      theme: "transparency",
      status: AccountabilityCommitmentStatus.completed,
      targetDate: new Date("2026-04-15T00:00:00.000Z"),
      latestUpdate: "Completed for Q1 2026 demonstration cycle.",
      isDemonstration: true,
      updates: {
        create: {
          status: AccountabilityCommitmentStatus.completed,
          summary: "First quarterly pack published from an approved snapshot.",
        },
      },
    },
    update: {
      status: AccountabilityCommitmentStatus.completed,
      isDemonstration: true,
    },
  });

  await prisma.accountabilityCommitment.upsert({
    where: { slug: "reduce-transport-late-pickups" },
    create: {
      slug: "reduce-transport-late-pickups",
      title: "Reduce late accessible transport pickups",
      plainLanguage:
        "Improve on-time pickup performance for wheelchair-accessible journeys.",
      accountableBody: "Transport operations",
      serviceVertical: "transport",
      theme: "reliability",
      status: AccountabilityCommitmentStatus.delayed,
      targetDate: new Date("2026-03-31T00:00:00.000Z"),
      delayReason:
        "Fleet availability constraints in two regions delayed the rollout of replacement-vehicle protocols.",
      latestUpdate: "Mitigation plan in progress; commitment remains visible.",
      isDemonstration: true,
      updates: {
        create: {
          status: AccountabilityCommitmentStatus.delayed,
          summary:
            "Target missed; delay reason and mitigation published for accountability.",
        },
      },
    },
    update: {
      status: AccountabilityCommitmentStatus.delayed,
      delayReason:
        "Fleet availability constraints in two regions delayed the rollout of replacement-vehicle protocols.",
      isDemonstration: true,
    },
  });

  await prisma.accountabilityCorrection.upsert({
    where: { publicId: "demo-correction-fulfilment-q1" },
    create: {
      publicId: "demo-correction-fulfilment-q1",
      title: "Correction to service fulfilment rate (Q1 demo)",
      originalValueSummary: "95.1% fulfilment (draft extract)",
      correctedValueSummary: "94.2% fulfilment (validated extract)",
      reason:
        "Draft extract included out-of-scope participant cancellations. Validated methodology excludes those cancellations from the failure numerator.",
      discoveryDate: new Date("2026-04-05T00:00:00.000Z"),
      correctionDate: new Date("2026-04-08T00:00:00.000Z"),
      materiality: "material",
      approvingAuthority: "Publication approver",
      snapshotId: snapshot.id,
      status: "published",
      isDemonstration: true,
    },
    update: {
      correctedValueSummary: "94.2% fulfilment (validated extract)",
      isDemonstration: true,
    },
  });

  await prisma.accountabilityGovernanceDecision.upsert({
    where: { publicId: "demo-decision-publication-policy" },
    create: {
      publicId: "demo-decision-publication-policy",
      decisionDate: new Date("2026-02-12T00:00:00.000Z"),
      decisionBody: "Accountability stewardship committee",
      questionConsidered:
        "Should public accountability metrics require independent approval before release?",
      decisionSummary:
        "Yes. Preparation and approval must be performed by different authorised people. Corrections must preserve original published values.",
      optionsConsidered:
        "1) Single-approver publish 2) Independent approval with audit trail (selected)",
      participantRightsImplications:
        "Improves trust that public claims are reviewable and challengeable.",
      accessibilityImplications:
        "Publication packages must include plain-language summaries and table alternatives.",
      privacyImplications:
        "Cohort suppression and no operational free-text in public packages.",
      implementationOwner: "Publication editor",
      status: "published",
      publishedAt: new Date("2026-02-15T00:00:00.000Z"),
      isDemonstration: true,
    },
    update: { isDemonstration: true },
  });

  await prisma.accountabilityAiSystem.upsert({
    where: { publicCode: "care-matching-assist" },
    create: {
      publicCode: "care-matching-assist",
      name: "Care matching assistant",
      purpose:
        "Recommends candidate support workers for a care request. Does not make the final assignment decision.",
      serviceVertical: "care",
      decisionRole: "recommends",
      humanReviewRequired: true,
      dataCategoriesJson: ["availability", "credentials", "stated preferences"],
      prohibitedUsesJson: ["surveillance scoring", "disability ranking"],
      knownLimitations:
        "May under-represent workers with sparse preference data. Human coordinators must review.",
      affectedUserGroups: "Participants and support workers",
      accessibilityNotes: "Recommendations must be explainable in plain language.",
      biasFairnessNotes: "Periodic fairness review required before material model changes.",
      overrideMechanisms: "Coordinator can reject or replace any recommendation.",
      appealPathway: "Use /accountability/submit or support pathways to challenge outcomes.",
      monitoringFrequency: "monthly",
      modelOrRuleVersion: "rules-2026.1",
      responsibleOwner: "Care matching product owner",
      retirementStatus: "active",
      status: "published",
      publishedAt: new Date("2026-03-01T00:00:00.000Z"),
      isDemonstration: true,
    },
    update: { isDemonstration: true },
  });

  const dataset = await prisma.accountabilityOpenDataset.upsert({
    where: { publicId: "demo-care-reliability-q1" },
    create: {
      publicId: "demo-care-reliability-q1",
      title: "Care reliability aggregates (demo)",
      description:
        "Privacy-safe Care reliability indicators for the demonstration reporting period.",
      publisher: "MapAble",
      geography: "Australia (demo)",
      updateFrequency: "quarterly",
      licence: "CC BY 4.0",
      methodologySummary: "See methodology svc-fulfilment-v1.",
      schemaJson: {
        fields: [
          { name: "metric_code", type: "string" },
          { name: "value", type: "number|null" },
          { name: "sample_size", type: "number" },
        ],
      },
      suppressionRules: "Values with sample size below 10 are null with notice.",
      knownLimitations: "Demonstration data only. Not a production claim.",
      status: "published",
      isDemonstration: true,
    },
    update: { status: "published", isDemonstration: true },
  });

  const datasetPackage = {
    metrics: packageJson.metrics,
    period: "2026-Q1",
  };
  await prisma.accountabilityDatasetVersion.deleteMany({
    where: { datasetId: dataset.id, version: "2026.1-demo" },
  });
  await prisma.accountabilityDatasetVersion.create({
    data: {
      datasetId: dataset.id,
      version: "2026.1-demo",
      reportingPeriodStart: periodStart,
      reportingPeriodEnd: periodEnd,
      checksum: hashPublicationPackage(datasetPackage),
      recordCount: 3,
      packageJson: datasetPackage,
      publishedAt: new Date("2026-04-10T00:00:00.000Z"),
    },
  });

  await prisma.accountabilityPublicNotice.upsert({
    where: { publicId: "demo-notice-correction-active" },
    create: {
      publicId: "demo-notice-correction-active",
      noticeType: "public_correction",
      title: "Active correction: service fulfilment rate",
      body: "A material correction was issued for the Q1 demonstration fulfilment rate. Original and corrected values remain available on the corrections page.",
      severity: "important",
      isActive: true,
      isDemonstration: true,
      publishedAt: new Date("2026-04-08T00:00:00.000Z"),
    },
    update: { isActive: true, isDemonstration: true },
  });

  await prisma.accountabilityPublicNotice.upsert({
    where: { publicId: "demo-notice-missed-commitment" },
    create: {
      publicId: "demo-notice-missed-commitment",
      noticeType: "missed_commitment",
      title: "Delayed commitment: late accessible transport pickups",
      body: "The commitment to reduce late accessible transport pickups missed its target date. The delay reason remains published.",
      severity: "important",
      isActive: true,
      isDemonstration: true,
      publishedAt: new Date("2026-04-01T00:00:00.000Z"),
    },
    update: { isActive: true, isDemonstration: true },
  });

  console.log("  Accountability demo seed complete (demonstration data only)");
}
