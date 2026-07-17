import {
  applyCohortSuppression,
  describeTrend,
} from "@/lib/accountability/disclosure";
import { verifyPublicationChecksum } from "@/lib/accountability/snapshot-hash";
import type {
  AccountabilityPortalStatus,
  PublicMetricCard,
} from "@/lib/accountability/types";
import {
  DEMONSTRATION_DATA_BANNER,
  accountabilityConfig,
} from "@/lib/config/accountability";
import { prisma } from "@/lib/prisma";

function periodLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  };
  return `${start.toLocaleDateString("en-AU", opts)} – ${end.toLocaleDateString("en-AU", opts)}`;
}

function statusAgainstTarget(
  value: number | null,
  target: number | null,
  suppressed: boolean
): PublicMetricCard["statusAgainstTarget"] {
  if (suppressed) return "suppressed";
  if (value == null || target == null) return "unknown";
  if (value >= target) return "met";
  if (value >= target * 0.9) return "on_track";
  return "missed";
}

export async function getLatestPublishedSnapshot() {
  if (!accountabilityConfig.portalEnabled) return null;
  return prisma.accountabilityPublicationSnapshot.findFirst({
    where: { status: { in: ["published", "corrected"] } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      publicId: true,
      title: true,
      reportingPeriodStart: true,
      reportingPeriodEnd: true,
      status: true,
      packageJson: true,
      contentSha256: true,
      previousSnapshotHash: true,
      dataCompletenessPct: true,
      hasMajorCorrection: true,
      hasUnresolvedCriticalCommitment: true,
      isDemonstration: true,
      publishedAt: true,
    },
  });
}

export async function getPortalStatus(): Promise<AccountabilityPortalStatus> {
  const snapshot = await getLatestPublishedSnapshot();
  if (!snapshot) {
    return {
      reportingPeriodLabel: "No published reporting period yet",
      latestPublicationDate: null,
      dataCompletenessPct: null,
      hasMajorCorrection: false,
      hasUnresolvedCriticalCommitment: false,
      snapshotPublicId: null,
      contentSha256: null,
      isDemonstration: false,
    };
  }
  return {
    reportingPeriodLabel: periodLabel(
      snapshot.reportingPeriodStart,
      snapshot.reportingPeriodEnd
    ),
    latestPublicationDate: snapshot.publishedAt?.toISOString() ?? null,
    dataCompletenessPct: snapshot.dataCompletenessPct,
    hasMajorCorrection: snapshot.hasMajorCorrection,
    hasUnresolvedCriticalCommitment: snapshot.hasUnresolvedCriticalCommitment,
    snapshotPublicId: snapshot.publicId,
    contentSha256: snapshot.contentSha256,
    isDemonstration: snapshot.isDemonstration,
  };
}

export async function listPublishedHeadlineMetrics(): Promise<PublicMetricCard[]> {
  const snapshot = await getLatestPublishedSnapshot();
  if (!snapshot) return [];

  const values = await prisma.accountabilityMetricValue.findMany({
    where: {
      snapshotId: snapshot.id,
      status: { in: ["published", "corrected"] },
    },
    include: {
      metric: { include: { methodology: true } },
    },
    orderBy: { metric: { name: "asc" } },
    take: 12,
  });

  return values.map((row) => {
    const disclosure = applyCohortSuppression(row.sampleSize, row.value, {
      minimumCohortSize: row.metric.minimumCohortSize,
    });
    const value = disclosure.suppressed ? null : disclosure.roundedValue;
    return {
      publicCode: row.metric.publicCode,
      name: row.metric.name,
      domain: row.metric.domain,
      unit: row.metric.unit,
      value,
      numerator: disclosure.suppressed ? null : (row.numerator ?? null),
      denominator: disclosure.suppressed ? null : (row.denominator ?? null),
      target: row.target ?? null,
      previousValue: row.previousValue ?? null,
      sampleSize: row.sampleSize ?? null,
      completenessPercentage: row.completenessPercentage ?? null,
      reportingPeriodStart: row.reportingPeriodStart.toISOString(),
      reportingPeriodEnd: row.reportingPeriodEnd.toISOString(),
      methodologyPublicCode: row.metric.methodology.publicCode,
      accessibleSummary:
        disclosure.suppressed
          ? (disclosure.notice ?? "Value suppressed for privacy.")
          : (row.accessibleSummary ??
            `${row.metric.name}: ${value ?? "not available"}`),
      trendDescription:
        row.trendDescription ??
        describeTrend(value, row.previousValue ?? null),
      statusAgainstTarget: statusAgainstTarget(
        value,
        row.target ?? null,
        disclosure.suppressed
      ),
      suppressionReason: disclosure.suppressed
        ? (disclosure.notice ?? row.suppressionReason)
        : null,
      isDemonstration: row.isDemonstration || row.metric.isDemonstration,
    };
  });
}

export async function listPublishedMethodologies() {
  return prisma.accountabilityMethodology.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    select: {
      publicCode: true,
      title: true,
      plainLanguage: true,
      version: true,
      ownerRole: true,
      metrics: {
        where: { isActive: true },
        select: { publicCode: true, name: true, domain: true },
      },
    },
  });
}

export async function getPublishedMethodology(publicCode: string) {
  return prisma.accountabilityMethodology.findFirst({
    where: { publicCode, isActive: true },
    include: {
      metrics: {
        where: { isActive: true },
        select: {
          publicCode: true,
          name: true,
          description: true,
          domain: true,
          unit: true,
          numeratorDefinition: true,
          denominatorDefinition: true,
          minimumCohortSize: true,
          updateFrequency: true,
        },
      },
    },
  });
}

export async function listPublishedCorrections() {
  return prisma.accountabilityCorrection.findMany({
    where: { status: { in: ["published", "active"] } },
    orderBy: { correctionDate: "desc" },
    take: 50,
    select: {
      publicId: true,
      title: true,
      originalValueSummary: true,
      correctedValueSummary: true,
      reason: true,
      discoveryDate: true,
      correctionDate: true,
      materiality: true,
      approvingAuthority: true,
      isDemonstration: true,
    },
  });
}

export async function getPublishedCorrection(publicId: string) {
  return prisma.accountabilityCorrection.findFirst({
    where: { publicId, status: { in: ["published", "active"] } },
  });
}

export async function listActivePublicNotices() {
  const now = new Date();
  return prisma.accountabilityPublicNotice.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      publicId: true,
      noticeType: true,
      title: true,
      body: true,
      severity: true,
      isDemonstration: true,
      publishedAt: true,
    },
  });
}

export async function listPublishedCommitments(filters?: {
  status?: string;
  serviceVertical?: string;
}) {
  return prisma.accountabilityCommitment.findMany({
    where: {
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.serviceVertical
        ? { serviceVertical: filters.serviceVertical }
        : {}),
    },
    orderBy: { publicationDate: "desc" },
    take: 100,
    select: {
      slug: true,
      title: true,
      plainLanguage: true,
      accountableBody: true,
      serviceVertical: true,
      region: true,
      theme: true,
      status: true,
      targetDate: true,
      latestUpdate: true,
      delayReason: true,
      withdrawalDate: true,
      withdrawalReason: true,
      isDemonstration: true,
    },
  });
}

export async function listPublishedAiSystems() {
  return prisma.accountabilityAiSystem.findMany({
    where: { status: "published" },
    orderBy: { name: "asc" },
    select: {
      publicCode: true,
      name: true,
      purpose: true,
      serviceVertical: true,
      decisionRole: true,
      humanReviewRequired: true,
      knownLimitations: true,
      appealPathway: true,
      retirementStatus: true,
      isDemonstration: true,
    },
  });
}

export async function listPublishedGovernanceDecisions() {
  return prisma.accountabilityGovernanceDecision.findMany({
    where: { status: "published" },
    orderBy: { decisionDate: "desc" },
    take: 50,
    select: {
      publicId: true,
      decisionDate: true,
      decisionBody: true,
      questionConsidered: true,
      decisionSummary: true,
      implementationOwner: true,
      isDemonstration: true,
    },
  });
}

export async function listPublishedDatasets() {
  return prisma.accountabilityOpenDataset.findMany({
    where: { status: "published" },
    orderBy: { title: "asc" },
    select: {
      publicId: true,
      title: true,
      description: true,
      publisher: true,
      geography: true,
      updateFrequency: true,
      licence: true,
      knownLimitations: true,
      isDemonstration: true,
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          version: true,
          checksum: true,
          publishedAt: true,
          recordCount: true,
        },
      },
    },
  });
}

export async function verifySnapshotByPublicId(publicId: string) {
  const snapshot = await prisma.accountabilityPublicationSnapshot.findFirst({
    where: {
      publicId,
      status: { in: ["published", "corrected", "withdrawn"] },
    },
    select: {
      publicId: true,
      title: true,
      contentSha256: true,
      previousSnapshotHash: true,
      packageJson: true,
      publishedAt: true,
      status: true,
      isDemonstration: true,
    },
  });
  if (!snapshot || !snapshot.contentSha256) {
    return null;
  }
  const valid = verifyPublicationChecksum(
    snapshot.packageJson,
    snapshot.contentSha256
  );
  return {
    publicId: snapshot.publicId,
    title: snapshot.title,
    status: snapshot.status,
    contentSha256: snapshot.contentSha256,
    previousSnapshotHash: snapshot.previousSnapshotHash,
    publishedAt: snapshot.publishedAt,
    checksumValid: valid,
    isDemonstration: snapshot.isDemonstration,
    demonstrationBanner: snapshot.isDemonstration
      ? DEMONSTRATION_DATA_BANNER
      : null,
  };
}

export async function createPublicChallenge(params: {
  subjectType: string;
  subjectPublicId?: string;
  description: string;
}) {
  const trackingReference = `ACC-CH-${Date.now().toString(36).toUpperCase()}`;
  return prisma.accountabilityPublicChallenge.create({
    data: {
      trackingReference,
      subjectType: params.subjectType,
      subjectPublicId: params.subjectPublicId,
      description: params.description,
      status: "received",
    },
    select: {
      trackingReference: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function createPublicSubscription(params: {
  topics: string[];
  channel?: string;
  userId?: string;
  emailHash?: string;
}) {
  return prisma.accountabilitySubscription.create({
    data: {
      topicsJson: params.topics,
      channel: params.channel ?? "email",
      userId: params.userId,
      emailHash: params.emailHash,
      consentGranted: true,
    },
    select: {
      id: true,
      channel: true,
      topicsJson: true,
      createdAt: true,
    },
  });
}

/** Domain browse cards for the portal home — static IA, no operational queries. */
export const ACCOUNTABILITY_DOMAIN_CARDS = [
  {
    href: "/accountability/performance",
    title: "Service Performance",
    description: "Care, transport and jobs reliability published from approved snapshots.",
  },
  {
    href: "/accountability/quality-safeguards",
    title: "Quality and Safeguards",
    description: "Aggregated safeguarding and quality outcomes with privacy controls.",
  },
  {
    href: "/accountability/complaints",
    title: "Complaints and Incidents",
    description: "Complaint trends, incident learning and corrective actions.",
  },
  {
    href: "/accountability/accessibility",
    title: "Accessibility",
    description: "Accessibility map coverage, verification and correction performance.",
  },
  {
    href: "/accountability/governance",
    title: "Governance",
    description: "Public decisions, advisory structures and accountability assignments.",
  },
  {
    href: "/accountability/ai",
    title: "AI and Algorithms",
    description: "Public register of AI systems, limitations and challenge pathways.",
  },
  {
    href: "/accountability/impact",
    title: "Social Impact",
    description: "Direct outputs and carefully attributed participant-reported outcomes.",
  },
  {
    href: "/accountability/open-data",
    title: "Open Data",
    description: "Privacy-safe downloadable datasets with methodology and checksums.",
  },
] as const;
