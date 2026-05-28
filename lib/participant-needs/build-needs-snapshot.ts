import { prisma } from "@/lib/prisma";
import type {
  NeedsGap,
  NeedsSignal,
  ParticipantNeedsDomain,
  ParticipantNeedsSnapshot,
} from "@/lib/participant-needs/types";
import { resolveParticipantUserId } from "@/lib/participant-needs/resolve-participant-user";
import {
  isMockParticipant,
  MOCK_GOALS,
  MOCK_OPEN_RISKS,
  MOCK_PARTICIPANT_ID,
  MOCK_PROFILE,
} from "@/lib/prms/mockPrmsData";

function signal(
  domain: ParticipantNeedsDomain,
  label: string,
  source: NeedsSignal["source"],
  confidence = 0.85,
): NeedsSignal {
  return {
    id: `${domain}-${label}`.replace(/\s+/g, "-").toLowerCase().slice(0, 48),
    domain,
    label,
    source,
    confidence,
  };
}

function jsonLabels(value: unknown, domain: ParticipantNeedsDomain): NeedsSignal[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (typeof item === "string" && item.trim()) {
        return [signal(domain, item.trim(), "accessibility", 0.8)];
      }
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        const label =
          typeof obj.label === "string"
            ? obj.label
            : typeof obj.name === "string"
              ? obj.name
              : typeof obj.mode === "string"
                ? obj.mode
                : null;
        if (label) {
          return [
            signal(domain, label, "accessibility", 0.8),
          ];
        }
      }
      if (item != null) {
        return [signal(domain, `Item ${index + 1}`, "accessibility", 0.5)];
      }
      return [];
    });
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v === true || (typeof v === "string" && v.trim()))
      .map(([key, v]) =>
        signal(
          domain,
          typeof v === "string" ? v : key.replace(/_/g, " "),
          "accessibility",
          0.75,
        ),
      );
  }
  return [];
}

function computeCompletion(
  profile: {
    displayName?: string;
    homeSuburb?: string | null;
    participantNotes?: string | null;
  } | null,
  accessibility: boolean,
  accessNeedCount: number,
): { percent: number; hints: string[] } {
  const hints: string[] = [];
  let score = 0;
  const total = 5;

  if (profile?.displayName) score += 1;
  else hints.push("Add your display name in participant profile.");

  if (profile?.homeSuburb) score += 1;
  else hints.push("Add your home suburb to improve local matching.");

  if (accessibility) score += 1;
  else hints.push("Complete your accessibility profile for safer support matching.");

  if (accessNeedCount > 0) score += 1;
  else hints.push("Record active care access needs when you know them.");

  if (profile?.participantNotes?.trim()) score += 1;
  else hints.push("Optional: add notes about what works well for you.");

  return {
    percent: Math.round((score / total) * 100),
    hints,
  };
}

function detectGaps(
  signals: NeedsSignal[],
  query?: string,
): NeedsGap[] {
  const gaps: NeedsGap[] = [];
  const domains = new Set(signals.map((s) => s.domain));
  const q = (query ?? "").toLowerCase();

  const requiredDomains: ParticipantNeedsDomain[] = [
    "mobility",
    "communication",
    "transport",
    "daily_living",
  ];

  for (const domain of requiredDomains) {
    if (!domains.has(domain)) {
      gaps.push({
        domain,
        reason: `No ${domain.replace(/_/g, " ")} information on file yet.`,
        severity: "watch",
      });
    }
  }

  if (
    (q.includes("transport") || q.includes("wheelchair") || q.includes("ride")) &&
    !domains.has("transport")
  ) {
    gaps.push({
      domain: "transport",
      reason: "You mentioned transport, but transport requirements are not documented.",
      severity: "urgent",
    });
  }

  if (
    (q.includes("communicat") || q.includes("language") || q.includes("plain")) &&
    !domains.has("communication")
  ) {
    gaps.push({
      domain: "communication",
      reason: "Communication preferences are missing for provider matching.",
      severity: "watch",
    });
  }

  return gaps;
}

function buildMockSnapshot(
  participantId: string,
  query?: string,
): ParticipantNeedsSnapshot {
  const signals: NeedsSignal[] = [
    ...MOCK_PROFILE.accessNeeds.map((a) =>
      signal(a.category as ParticipantNeedsDomain, a.label, "profile", 0.95),
    ),
    ...MOCK_PROFILE.mobilityAids.map((m) =>
      signal("mobility", m.label, "accessibility", 0.9),
    ),
    ...MOCK_PROFILE.communicationPreferences.map((c) =>
      signal(
        "communication",
        c.detail ? `${c.mode}: ${c.detail}` : c.mode,
        "accessibility",
        0.9,
      ),
    ),
    ...MOCK_GOALS.map((g) =>
      signal("plan_goals", g.summary, "plan_summary", 0.85),
    ),
    ...MOCK_OPEN_RISKS.map((r) =>
      signal("risks", r.label, "inferred", r.level === "urgent" ? 0.95 : 0.7),
    ),
  ];

  const gaps = detectGaps(signals, query);

  return {
    participantId,
    participantUserId: participantId,
    displayName: MOCK_PROFILE.preferredName,
    serviceRegion: null,
    signals,
    gaps,
    profileCompletionPercent: MOCK_PROFILE.profileCompletionPercent,
    profileCompletionHints: gaps.length
      ? ["Review gaps below to strengthen your participant record."]
      : [],
  };
}

export async function buildParticipantNeedsSnapshot(
  participantId: string,
  query?: string,
): Promise<ParticipantNeedsSnapshot | null> {
  if (isMockParticipant(participantId)) {
    return buildMockSnapshot(participantId, query);
  }

  const userId = resolveParticipantUserId(participantId);
  if (!userId) {
    return null;
  }

  const [profile, accessibility, accessNeeds, planSummary, careRequests] =
    await Promise.all([
      prisma.participantProfile.findUnique({ where: { userId } }),
      prisma.accessibilityProfile.findUnique({ where: { userId } }),
      prisma.careAccessNeed.findMany({
        where: { participantId: userId, active: true },
        take: 20,
      }),
      prisma.participantSupportPlanSummary.findUnique({
        where: { participantId: userId },
      }),
      prisma.careRequest.findMany({
        where: { participantId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          accessRequirementsSummary: true,
          communicationNotes: true,
          preferredWorkerAttributes: true,
        },
      }),
    ]);

  if (!profile && !accessibility && accessNeeds.length === 0) {
    return null;
  }

  const signals: NeedsSignal[] = [];

  if (profile?.participantNotes?.trim()) {
    signals.push(
      signal("daily_living", "Participant notes on file", "profile", 0.6),
    );
  }

  if (accessibility) {
    signals.push(
      ...jsonLabels(accessibility.mobilityNeeds, "mobility"),
      ...jsonLabels(accessibility.communicationPreferences, "communication"),
      ...jsonLabels(accessibility.transportRequirements, "transport"),
      ...jsonLabels(accessibility.sensoryPreferences, "daily_living"),
      ...jsonLabels(accessibility.cognitivePreferences, "communication"),
    );
  }

  for (const need of accessNeeds) {
    const domain = mapCategoryToDomain(need.category);
    signals.push(signal(domain, need.summary, "care_access_need", 0.9));
  }

  if (planSummary?.summaryJson && typeof planSummary.summaryJson === "object") {
    const summary = planSummary.summaryJson as Record<string, unknown>;
    if (Array.isArray(summary.goals)) {
      for (const goal of summary.goals) {
        if (typeof goal === "string") {
          signals.push(signal("plan_goals", goal, "plan_summary", 0.75));
        } else if (goal && typeof goal === "object") {
          const g = goal as Record<string, unknown>;
          const text =
            typeof g.summary === "string"
              ? g.summary
              : typeof g.label === "string"
                ? g.label
                : null;
          if (text) {
            signals.push(signal("plan_goals", text, "plan_summary", 0.75));
          }
        }
      }
    }
  }

  for (const request of careRequests) {
    if (request.accessRequirementsSummary?.trim()) {
      signals.push(
        signal(
          "daily_living",
          request.accessRequirementsSummary.trim(),
          "care_request",
          0.8,
        ),
      );
    }
    if (request.communicationNotes?.trim()) {
      signals.push(
        signal(
          "communication",
          request.communicationNotes.trim(),
          "care_request",
          0.75,
        ),
      );
    }
    if (request.title?.trim()) {
      signals.push(
        signal("social_community", request.title.trim(), "care_request", 0.65),
      );
    }
  }

  const { percent, hints } = computeCompletion(
    profile,
    Boolean(accessibility),
    accessNeeds.length,
  );

  const gaps = detectGaps(signals, query);

  const serviceRegion =
    profile?.homeSuburb && profile?.homeState
      ? `${profile.homeSuburb}, ${profile.homeState}`
      : profile?.homeSuburb ?? null;

  return {
    participantId,
    participantUserId: userId,
    displayName: profile?.preferredName ?? profile?.displayName ?? null,
    serviceRegion,
    signals: dedupeSignals(signals),
    gaps,
    profileCompletionPercent: percent,
    profileCompletionHints: hints,
  };
}

function mapCategoryToDomain(category: string): ParticipantNeedsDomain {
  const lower = category.toLowerCase();
  if (lower.includes("mobil")) return "mobility";
  if (lower.includes("communicat")) return "communication";
  if (lower.includes("transport")) return "transport";
  if (lower.includes("risk")) return "risks";
  if (lower.includes("goal")) return "plan_goals";
  if (lower.includes("social")) return "social_community";
  return "daily_living";
}

function dedupeSignals(signals: NeedsSignal[]): NeedsSignal[] {
  const seen = new Set<string>();
  return signals.filter((s) => {
    const key = `${s.domain}:${s.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { MOCK_PARTICIPANT_ID };
