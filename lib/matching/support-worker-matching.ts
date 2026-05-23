import type { MatchFactorType, WorkerCredentialStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase4Config } from "@/lib/config/phase4";
import { getTravelTimeSeconds } from "@/lib/routing/travel-matrix-service";
import { prisma } from "@/lib/prisma";
import type {
  HardFilterCode,
  MatchConfidence,
  MatchReason,
  MatchWarning,
  MatchWarningCode,
  ParticipantSupportProfile,
  ScoreReasonCode,
  SupportRequest,
  SupportWorker,
  WorkerMatch,
  WorkerMatchEventType,
  WorkerSafetyBadge,
} from "@/types/support-workers";
import { RISK_PENALTIES, SCORE_WEIGHTS } from "@/types/support-workers";

type WorkerCandidate = {
  id: string;
  displayName: string;
  profileSummary: string | null;
  organisationId: string;
  organisationName: string;
  serviceTypes: string[];
  serviceRegions: string[];
  languages: string[];
  communicationCapabilities: unknown;
  qualificationsSummary: string | null;
  verificationStatus: WorkerCredentialStatus;
  workerScreeningStatus: WorkerCredentialStatus;
  wwccStatus: WorkerCredentialStatus;
  firstAidStatus: WorkerCredentialStatus;
  capabilities: string[];
  behaviourSupportPlanTrained: boolean;
  gender: string | null;
  maxTravelRadiusKm: number;
  communicationModes: string[];
  reliabilityScore: number;
  cancellationRate: number;
  hasUnresolvedIncident: boolean;
};

const REASON_TO_FACTOR: Record<ScoreReasonCode, MatchFactorType> = {
  QUALIFICATION_FIT: "qualification_fit",
  AVAILABILITY_FIT: "availability_fit",
  LOCATION_FIT: "location_fit",
  PREFERENCE_FIT: "preference_fit",
  CONTINUITY: "continuity_of_support",
  COMMUNICATION_FIT: "communication_fit",
  RELIABILITY_FIT: "reliability_fit",
};

const DAY_MAP = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function isCredentialValid(status: WorkerCredentialStatus) {
  return status === "verified";
}

function isCredentialExpired(status: WorkerCredentialStatus) {
  return status === "expired" || status === "rejected";
}

function parseCommunicationModes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    if (typeof x === "string") return x;
    if (x && typeof x === "object" && "mode" in x) return String((x as { mode: string }).mode);
    return String(x);
  });
}

export function buildSafetyBadges(worker: WorkerCandidate): WorkerSafetyBadge[] {
  const badges: WorkerSafetyBadge[] = [];
  badges.push({
    code: "verification",
    label:
      worker.verificationStatus === "verified"
        ? "Verified worker"
        : "Verification pending review",
    status: worker.verificationStatus === "verified" ? "ok" : "caution",
  });
  badges.push({
    code: "screening",
    label:
      worker.workerScreeningStatus === "verified"
        ? "Worker screening current"
        : "Worker screening needs review",
    status: worker.workerScreeningStatus === "verified" ? "ok" : "caution",
  });
  badges.push({
    code: "wwcc",
    label:
      worker.wwccStatus === "verified"
        ? "WWCC current"
        : worker.wwccStatus === "expired"
          ? "WWCC expired"
          : "WWCC status unknown",
    status:
      worker.wwccStatus === "verified"
        ? "ok"
        : worker.wwccStatus === "expired"
          ? "caution"
          : "unknown",
  });
  if (worker.hasUnresolvedIncident) {
    badges.push({
      code: "incident",
      label: "Incident under review",
      status: "caution",
    });
  }
  return badges;
}

export function toSupportWorker(worker: WorkerCandidate): SupportWorker {
  return {
    id: worker.id,
    displayName: worker.displayName,
    profileSummary: worker.profileSummary,
    organisationId: worker.organisationId,
    organisationName: worker.organisationName,
    serviceTypes: worker.serviceTypes,
    languages: worker.languages,
    communicationModes: worker.communicationModes,
    capabilities: worker.capabilities,
    verificationStatus: worker.verificationStatus,
    workerScreeningStatus: worker.workerScreeningStatus,
    wwccStatus: worker.wwccStatus,
    firstAidStatus: worker.firstAidStatus,
    badges: buildSafetyBadges(worker),
  };
}

export async function loadParticipantSupportProfile(
  participantId: string
): Promise<ParticipantSupportProfile> {
  const [prefs, accessibility] = await Promise.all([
    prisma.participantMatchPreferences.findUnique({ where: { participantId } }),
    prisma.accessibilityProfile.findUnique({ where: { userId: participantId } }),
  ]);

  return {
    participantId,
    preferredWorkerIds: prefs?.preferredWorkerIds ?? [],
    blockedWorkerIds: prefs?.blockedWorkerIds ?? [],
    hiddenWorkerIds: prefs?.hiddenWorkerIds ?? [],
    preferredGender: prefs?.preferredGender ?? null,
    preferredLanguages: prefs?.preferredLanguages ?? [],
    preferredCommunicationModes: prefs?.preferredCommunicationModes ?? [],
    maxDistanceKm: prefs?.maxDistanceKm ?? 40,
    continuityPreferred: prefs?.continuityPreferred ?? true,
    requiresBehaviourSupportPlan: prefs?.requiresBehaviourSupportPlan ?? false,
    communicationPreferences: (accessibility?.communicationPreferences as unknown[]) ?? [],
  };
}

async function fetchCandidateWorkers(excludeIds: string[] = []) {
  const workers = await prisma.workerProfile.findMany({
    where: {
      active: true,
      id: excludeIds.length ? { notIn: excludeIds } : undefined,
      organisation: { status: "active" },
    },
    include: {
      organisation: true,
      matchProfile: true,
      availabilityWindows: { where: { active: true } },
    },
    take: 200,
  });

  return workers.map((w): WorkerCandidate => {
    const commFromProfile = w.matchProfile?.communicationModes?.length
      ? w.matchProfile.communicationModes
      : parseCommunicationModes(w.communicationCapabilities);

    return {
      id: w.id,
      displayName: w.displayName,
      profileSummary: w.profileSummary,
      organisationId: w.organisationId,
      organisationName: w.organisation.name,
      serviceTypes: w.serviceTypes,
      serviceRegions: w.serviceRegions,
      languages: w.languages,
      communicationCapabilities: w.communicationCapabilities,
      qualificationsSummary: w.qualificationsSummary,
      verificationStatus: w.verificationStatus,
      workerScreeningStatus: w.workerScreeningStatus,
      wwccStatus: w.wwccStatus,
      firstAidStatus: w.firstAidStatus,
      capabilities: w.matchProfile?.capabilities ?? [],
      behaviourSupportPlanTrained:
        w.matchProfile?.behaviourSupportPlanTrained ?? false,
      gender: w.matchProfile?.gender ?? null,
      maxTravelRadiusKm: w.matchProfile?.maxTravelRadiusKm ?? 50,
      communicationModes: commFromProfile,
      reliabilityScore: w.matchProfile?.reliabilityScore ?? 0.8,
      cancellationRate: w.matchProfile?.cancellationRate ?? 0,
      hasUnresolvedIncident: w.matchProfile?.hasUnresolvedIncident ?? false,
    };
  });
}

async function isWorkerAvailable(
  workerProfileId: string,
  startsAt: Date,
  endsAt: Date,
  recurringWindows: { dayOfWeek: string; startTime: string; endTime: string }[]
) {
  const datetimeWindow = await prisma.workerMatchAvailabilityWindow.findFirst({
    where: {
      workerProfileId,
      active: true,
      startsAt: { lte: startsAt },
      endsAt: { gte: endsAt },
    },
  });
  if (datetimeWindow) return true;

  const dayName = DAY_MAP[startsAt.getUTCDay()];
  const startMinutes = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
  const endMinutes = endsAt.getUTCHours() * 60 + endsAt.getUTCMinutes();

  for (const w of recurringWindows) {
    if (w.dayOfWeek !== dayName) continue;
    const [sh, sm] = w.startTime.split(":").map(Number);
    const [eh, em] = w.endTime.split(":").map(Number);
    const winStart = sh * 60 + sm;
    const winEnd = eh * 60 + em;
    if (startMinutes >= winStart && endMinutes <= winEnd) return true;
  }
  return false;
}

async function isWithinServiceRegion(
  worker: WorkerCandidate,
  request: SupportRequest
) {
  const maxKm = request.maxDistanceKm ?? 40;
  if (!request.lat || !request.lng) {
    if (worker.serviceRegions.length === 0) return true;
    return true;
  }

  const site = await prisma.serviceSite.findFirst({
    where: { organisationId: worker.organisationId, active: true },
  });
  if (!site) {
    return worker.serviceRegions.length > 0;
  }

  if (worker.maxTravelRadiusKm < maxKm) {
    const dist = haversineKm(site.lat, site.lng, request.lat, request.lng);
    return dist <= Math.min(maxKm, worker.maxTravelRadiusKm);
  }

  try {
    const travel = await getTravelTimeSeconds(
      { lat: site.lat, lng: site.lng },
      { lat: request.lat, lng: request.lng }
    );
    const km = travel.distanceMeters / 1000;
    return km <= maxKm;
  } catch {
    return haversineKm(site.lat, site.lng, request.lat, request.lng) <= maxKm;
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function applyHardFilters(
  workers: WorkerCandidate[],
  request: SupportRequest,
  profile: ParticipantSupportProfile,
  options?: { includeHidden?: boolean }
): Promise<{ passed: WorkerCandidate[]; excluded: { workerId: string; code: HardFilterCode }[] }> {
  const startsAt = new Date(request.startsAt);
  const endsAt = new Date(request.endsAt);
  const requiresBsp =
    request.requiresBehaviourSupportPlan ?? profile.requiresBehaviourSupportPlan;
  const requiredCaps = request.requiredCapabilities ?? [];

  const passed: WorkerCandidate[] = [];
  const excluded: { workerId: string; code: HardFilterCode }[] = [];

  for (const w of workers) {
    if (!options?.includeHidden && profile.hiddenWorkerIds.includes(w.id)) {
      excluded.push({ workerId: w.id, code: "PARTICIPANT_BLOCKED" });
      continue;
    }
    if (profile.blockedWorkerIds.includes(w.id)) {
      excluded.push({ workerId: w.id, code: "PARTICIPANT_BLOCKED" });
      continue;
    }
    if (!isCredentialValid(w.verificationStatus)) {
      excluded.push({ workerId: w.id, code: "NOT_VERIFIED" });
      continue;
    }
    if (!isCredentialValid(w.workerScreeningStatus)) {
      excluded.push({ workerId: w.id, code: "SCREENING_INVALID" });
      continue;
    }
    if (!w.serviceTypes.includes(request.supportType)) {
      excluded.push({ workerId: w.id, code: "UNSUPPORTED_SERVICE_TYPE" });
      continue;
    }
    const recurring = await prisma.availabilityWindow.findMany({
      where: { workerProfileId: w.id, active: true },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });
    const available = await isWorkerAvailable(w.id, startsAt, endsAt, recurring);
    if (!available) {
      excluded.push({ workerId: w.id, code: "NOT_AVAILABLE" });
      continue;
    }
    if (requiredCaps.length > 0) {
      const missing = requiredCaps.filter((c) => !w.capabilities.includes(c));
      if (missing.length > 0) {
        excluded.push({ workerId: w.id, code: "MISSING_CAPABILITY" });
        continue;
      }
    }
    if (requiresBsp && !w.behaviourSupportPlanTrained) {
      excluded.push({ workerId: w.id, code: "BSP_TRAINING_REQUIRED" });
      continue;
    }
    const inRegion = await isWithinServiceRegion(w, request);
    if (!inRegion) {
      excluded.push({ workerId: w.id, code: "OUT_OF_REGION" });
      continue;
    }
    passed.push(w);
  }

  return { passed, excluded };
}

function scoreQualification(worker: WorkerCandidate): MatchReason {
  let score = 0;
  const parts: string[] = [];
  if (isCredentialValid(worker.verificationStatus)) {
    score += 0.4;
    parts.push("Worker verification is current.");
  }
  if (isCredentialValid(worker.wwccStatus)) {
    score += 0.3;
    parts.push("WWCC is current.");
  }
  if (isCredentialValid(worker.firstAidStatus)) {
    score += 0.2;
    parts.push("First aid certification is current.");
  }
  if (worker.qualificationsSummary) {
    score += 0.1;
    parts.push("Qualifications are listed on profile.");
  }
  score = Math.min(1, score);
  return {
    code: "QUALIFICATION_FIT",
    label: "Qualifications",
    plainLanguageExplanation: parts.join(" ") || "Basic qualification checks applied.",
    weight: SCORE_WEIGHTS.QUALIFICATION_FIT,
    score,
  };
}

function scoreAvailability(): MatchReason {
  return {
    code: "AVAILABILITY_FIT",
    label: "Availability",
    plainLanguageExplanation:
      "This worker is available for your requested date and time.",
    weight: SCORE_WEIGHTS.AVAILABILITY_FIT,
    score: 1,
  };
}

async function scoreLocation(
  worker: WorkerCandidate,
  request: SupportRequest,
  maxDistanceKm: number
): Promise<MatchReason> {
  if (!request.lat || !request.lng) {
    return {
      code: "LOCATION_FIT",
      label: "Location",
      plainLanguageExplanation:
        "Location was not specified; regional service areas were used instead.",
      weight: SCORE_WEIGHTS.LOCATION_FIT,
      score: 0.6,
    };
  }
  const site = await prisma.serviceSite.findFirst({
    where: { organisationId: worker.organisationId, active: true },
  });
  if (!site) {
    return {
      code: "LOCATION_FIT",
      label: "Location",
      plainLanguageExplanation: "Travel distance could not be calculated from a depot.",
      weight: SCORE_WEIGHTS.LOCATION_FIT,
      score: 0.5,
    };
  }
  const km = haversineKm(site.lat, site.lng, request.lat, request.lng);
  const score = Math.max(0, 1 - km / maxDistanceKm);
  return {
    code: "LOCATION_FIT",
    label: "Location",
    plainLanguageExplanation: `Estimated distance is about ${Math.round(km)} km from the provider depot.`,
    weight: SCORE_WEIGHTS.LOCATION_FIT,
    score,
  };
}

function scorePreference(
  worker: WorkerCandidate,
  profile: ParticipantSupportProfile,
  request: SupportRequest
): MatchReason {
  let score = 0.5;
  const parts: string[] = [];
  if (profile.preferredWorkerIds.includes(worker.id)) {
    score = 1;
    parts.push("You saved this worker as a preferred support worker.");
  }
  if (request.preferredGender && worker.gender === request.preferredGender) {
    score = Math.min(1, score + 0.2);
    parts.push("Gender preference matches.");
  }
  if (request.languages?.length) {
    const overlap = request.languages.filter((l) => worker.languages.includes(l));
    if (overlap.length > 0) {
      score = Math.min(1, score + 0.2);
      parts.push(`Speaks ${overlap.join(", ")}.`);
    }
  }
  return {
    code: "PREFERENCE_FIT",
    label: "Your preferences",
    plainLanguageExplanation: parts.join(" ") || "No specific preference match recorded.",
    weight: SCORE_WEIGHTS.PREFERENCE_FIT,
    score,
  };
}

async function scoreContinuity(
  worker: WorkerCandidate,
  participantId: string,
  profile: ParticipantSupportProfile
): Promise<MatchReason> {
  if (!profile.continuityPreferred) {
    return {
      code: "CONTINUITY",
      label: "Continuity",
      plainLanguageExplanation: "Continuity preference not enabled.",
      weight: SCORE_WEIGHTS.CONTINUITY,
      score: 0.5,
    };
  }
  const prior = await prisma.careShift.count({
    where: {
      participantId,
      workerProfileId: worker.id,
      status: { in: ["completed", "approved"] },
    },
  });
  const score = prior > 0 ? 1 : 0.3;
  return {
    code: "CONTINUITY",
    label: "Continuity of support",
    plainLanguageExplanation:
      prior > 0
        ? `You have received support from this worker ${prior} time(s) before.`
        : "You have not worked with this worker before.",
    weight: SCORE_WEIGHTS.CONTINUITY,
    score,
  };
}

function scoreCommunication(
  worker: WorkerCandidate,
  profile: ParticipantSupportProfile,
  request: SupportRequest
): MatchReason {
  const requested = request.communicationModes ?? profile.preferredCommunicationModes;
  if (requested.length === 0) {
    return {
      code: "COMMUNICATION_FIT",
      label: "Communication",
      plainLanguageExplanation: "No specific communication modes requested.",
      weight: SCORE_WEIGHTS.COMMUNICATION_FIT,
      score: 0.7,
    };
  }
  const overlap = requested.filter((m) => worker.communicationModes.includes(m));
  const score = overlap.length / requested.length;
  return {
    code: "COMMUNICATION_FIT",
    label: "Communication",
    plainLanguageExplanation:
      overlap.length > 0
        ? `Supports ${overlap.join(", ")} communication.`
        : "Communication modes may need to be confirmed with the provider.",
    weight: SCORE_WEIGHTS.COMMUNICATION_FIT,
    score,
  };
}

function scoreReliability(worker: WorkerCandidate): MatchReason {
  const score = Math.max(0, Math.min(1, worker.reliabilityScore));
  return {
    code: "RELIABILITY_FIT",
    label: "Reliability",
    plainLanguageExplanation: `Reliability score is ${Math.round(score * 100)} out of 100 based on provider records.`,
    weight: SCORE_WEIGHTS.RELIABILITY_FIT,
    score,
  };
}

async function buildRiskWarnings(
  worker: WorkerCandidate,
  participantId: string,
  totalScore: number
): Promise<{ warnings: MatchWarning[]; penalty: number }> {
  const warnings: MatchWarning[] = [];
  let penalty = 0;

  if (worker.hasUnresolvedIncident) {
    warnings.push({
      code: "UNRESOLVED_INCIDENT",
      severity: "caution",
      plainLanguageExplanation:
        "This worker has an incident report that is still being reviewed.",
      iconLabel: "Incident review",
    });
    penalty += RISK_PENALTIES.UNRESOLVED_INCIDENT;
  }
  if (worker.cancellationRate > 0.2) {
    warnings.push({
      code: "HIGH_CANCELLATION",
      severity: "caution",
      plainLanguageExplanation:
        "This worker has a higher than usual cancellation rate. You may want to discuss backup plans.",
      iconLabel: "Cancellation rate",
    });
    penalty += RISK_PENALTIES.HIGH_CANCELLATION;
  }
  if (isCredentialExpired(worker.wwccStatus) || isCredentialExpired(worker.firstAidStatus)) {
    warnings.push({
      code: "EXPIRED_CHECK",
      severity: "caution",
      plainLanguageExplanation:
        "One or more safety checks may be expired. The provider should confirm before booking.",
      iconLabel: "Expired check",
    });
    penalty += RISK_PENALTIES.EXPIRED_CHECK;
  }

  const rejected = await prisma.workerMatchEvent.findFirst({
    where: {
      participantId,
      workerProfileId: worker.id,
      eventType: "reject",
    },
  });
  if (rejected) {
    warnings.push({
      code: "PREVIOUSLY_REJECTED",
      severity: "info",
      plainLanguageExplanation:
        "You previously chose not to match with this worker. You can still select them if you change your mind.",
      iconLabel: "Previously rejected",
    });
    penalty += RISK_PENALTIES.PREVIOUSLY_REJECTED;
  }

  if (totalScore < 75 && totalScore >= 50) {
    warnings.push({
      code: "LOW_CONFIDENCE",
      severity: "info",
      plainLanguageExplanation:
        "This is a moderate match. Review the reasons below and contact the provider if unsure.",
      iconLabel: "Moderate match",
    });
  } else if (totalScore < 50) {
    warnings.push({
      code: "LOW_CONFIDENCE",
      severity: "caution",
      plainLanguageExplanation:
        "This match has a lower score. Consider requesting more options or adjusting your search.",
      iconLabel: "Lower match score",
    });
    penalty += 5;
  }

  return { warnings, penalty };
}

function confidenceFromScore(score: number): MatchConfidence {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export async function scoreWorkerMatch(
  worker: WorkerCandidate,
  request: SupportRequest,
  profile: ParticipantSupportProfile
): Promise<WorkerMatch> {
  const maxKm = request.maxDistanceKm ?? profile.maxDistanceKm;
  const reasons: MatchReason[] = [
    scoreQualification(worker),
    scoreAvailability(),
    await scoreLocation(worker, request, maxKm),
    scorePreference(worker, profile, request),
    await scoreContinuity(worker, profile.participantId, profile),
    scoreCommunication(worker, profile, request),
    scoreReliability(worker),
  ];

  let total = 0;
  for (const r of reasons) {
    total += (r.score ?? 0) * (r.weight ?? 0);
  }

  const { warnings, penalty } = await buildRiskWarnings(
    worker,
    profile.participantId,
    total
  );
  const finalScore = Math.max(0, Math.round(total - penalty));

  return {
    worker: toSupportWorker(worker),
    score: finalScore,
    confidence: confidenceFromScore(finalScore),
    reasons,
    warnings,
    rank: 0,
  };
}

export async function searchSupportWorkers(
  request: SupportRequest,
  participantId: string
) {
  if (!phase4Config.supportWorkerMatchingEnabled) {
    return { workers: [], total: 0, filtersApplied: true, skipped: true };
  }

  const profile = await loadParticipantSupportProfile(participantId);
  const candidates = await fetchCandidateWorkers(request.excludeWorkerIds ?? []);
  const { passed } = await applyHardFilters(candidates, request, profile);

  const workers = passed.map(toSupportWorker);
  return { workers, total: workers.length, filtersApplied: true };
}

export async function matchSupportWorkers(
  request: SupportRequest,
  participantId: string,
  requestedById: string
) {
  if (!phase4Config.supportWorkerMatchingEnabled) {
    return { skipped: true, matches: [], matchRunId: null };
  }

  const profile = await loadParticipantSupportProfile(participantId);
  const candidates = await fetchCandidateWorkers(request.excludeWorkerIds ?? []);
  const { passed } = await applyHardFilters(candidates, request, profile);

  const limit = request.limit ?? 10;
  const scored: WorkerMatch[] = [];
  for (const w of passed) {
    scored.push(await scoreWorkerMatch(w, request, profile));
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit).map((m, i) => ({ ...m, rank: i + 1 }));

  const run = await prisma.matchRun.create({
    data: {
      matchType: "care_worker",
      participantId,
      requestedById,
      status: "completed",
      completedAt: new Date(),
    },
  });

  for (const match of top) {
    const candidate = await prisma.matchCandidate.create({
      data: {
        matchRunId: run.id,
        candidateType: "care_worker",
        candidateWorkerId: match.worker.id,
        candidateOrganisationId: match.worker.organisationId,
        score: match.score / 100,
        scoreExplanation: match.reasons.map((r) => r.plainLanguageExplanation).join(" "),
        status: match.confidence === "high" ? "recommended" : "generated",
        factors: {
          create: match.reasons.map((r) => ({
            factorType: REASON_TO_FACTOR[r.code],
            weight: r.weight ?? 1,
            score: r.score ?? 0,
            explanation: r.plainLanguageExplanation,
          })),
        },
      },
    });
    void candidate;
  }

  if (top[0]) {
    await prisma.workerMatchEvent.create({
      data: {
        participantId,
        workerProfileId: top[0].worker.id,
        eventType: "match_run",
        matchRunId: run.id,
        supportRequestSnapshot: request as object,
        resultSnapshot: top as unknown as object,
      },
    });
  }

  await createAuditEvent({
    actorUserId: requestedById,
    action: "support_worker.match_run",
    entityType: "MatchRun",
    entityId: run.id,
    participantId,
  });

  return { matchRunId: run.id, matches: top };
}

export async function recordMatchEvent(params: {
  participantId: string;
  actorUserId: string;
  eventType: WorkerMatchEventType;
  workerProfileId: string;
  matchRunId?: string;
  notes?: string;
  supportRequestSnapshot?: SupportRequest;
}) {
  let prefs = await prisma.participantMatchPreferences.findUnique({
    where: { participantId: params.participantId },
  });
  if (!prefs) {
    prefs = await prisma.participantMatchPreferences.create({
      data: { participantId: params.participantId },
    });
  }

  const update: {
    preferredWorkerIds?: string[];
    hiddenWorkerIds?: string[];
    blockedWorkerIds?: string[];
  } = {};

  if (params.eventType === "save_preferred") {
    const ids = new Set(prefs.preferredWorkerIds);
    ids.add(params.workerProfileId);
    update.preferredWorkerIds = [...ids];
  }
  if (params.eventType === "hide") {
    const ids = new Set(prefs.hiddenWorkerIds);
    ids.add(params.workerProfileId);
    update.hiddenWorkerIds = [...ids];
  }
  if (params.eventType === "reject") {
    const hidden = new Set(prefs.hiddenWorkerIds);
    hidden.add(params.workerProfileId);
    update.hiddenWorkerIds = [...hidden];
    await prisma.matchCandidate.updateMany({
      where: {
        candidateWorkerId: params.workerProfileId,
        matchRun: { participantId: params.participantId },
      },
      data: { status: "rejected" },
    });
  }

  if (Object.keys(update).length > 0) {
    await prisma.participantMatchPreferences.update({
      where: { participantId: params.participantId },
      data: update,
    });
  }

  const event = await prisma.workerMatchEvent.create({
    data: {
      participantId: params.participantId,
      workerProfileId: params.workerProfileId,
      eventType: params.eventType,
      matchRunId: params.matchRunId,
      notes: params.notes,
      supportRequestSnapshot: params.supportRequestSnapshot as object | undefined,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: `support_worker.${params.eventType}`,
    entityType: "WorkerMatchEvent",
    entityId: event.id,
    participantId: params.participantId,
  });

  return event;
}

/** Public-safe payload for tests — no internal notes or addresses. */
export function sanitizeMatchForParticipant(match: WorkerMatch) {
  return {
    worker: {
      id: match.worker.id,
      displayName: match.worker.displayName,
      organisationName: match.worker.organisationName,
      serviceTypes: match.worker.serviceTypes,
      languages: match.worker.languages,
      badges: match.worker.badges,
    },
    score: match.score,
    confidence: match.confidence,
    reasons: match.reasons.map((r) => ({
      label: r.label,
      plainLanguageExplanation: r.plainLanguageExplanation,
    })),
    warnings: match.warnings.map((w) => ({
      severity: w.severity,
      plainLanguageExplanation: w.plainLanguageExplanation,
      iconLabel: w.iconLabel,
    })),
    rank: match.rank,
  };
}
