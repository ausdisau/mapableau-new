import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type CommunicationRequirement,
} from "@/lib/connected-capability";

import type { CommunicationPassportProjection } from "./types";

export interface AccessibilityProfileSource {
  id: string;
  userId: string;
  communicationPreferences: unknown;
  cognitivePreferences?: unknown;
  sensoryPreferences?: unknown;
  digitalPreferences?: unknown;
  updatedAt?: Date | string;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mapPreferenceToRequirement(
  pref: string,
  index: number
): CommunicationRequirement {
  const kindMap: Record<string, CommunicationRequirement["kind"]> = {
    plain_language: "plain_language",
    aac: "aac_method",
    auslan: "interpreter",
    written_only: "written",
    phone: "spoken",
    sms: "written",
    email: "written",
    support_person: "supporter_role",
  };
  return {
    id: `req-pref-${index}`,
    kind: kindMap[pref] ?? "custom",
    value: pref,
    instructions: undefined,
    evidenceClass: "self_declared",
  };
}

/**
 * Read-only Communication Passport projection from AccessibilityProfile.
 * Does not create a competing participant profile.
 */
export function projectCommunicationPassport(
  profile: AccessibilityProfileSource | null,
  options?: {
    participantId?: string;
    participantAuthoredInstructions?: string[];
    isSynthetic?: boolean;
  }
): CommunicationPassportProjection {
  const participantId = options?.participantId ?? profile?.userId ?? "unknown";
  const prefs = asStringArray(profile?.communicationPreferences);
  const cognitive = asRecord(profile?.cognitivePreferences);
  const digital = asRecord(profile?.digitalPreferences);

  const requirements: CommunicationRequirement[] = prefs.map(
    mapPreferenceToRequirement
  );

  if (cognitive.oneQuestionAtATime === true || digital.oneQuestionAtATime === true) {
    requirements.push({
      id: "req-one-question",
      kind: "one_question_at_a_time",
      value: true,
      instructions: "Ask one question at a time and wait for a response.",
      evidenceClass: profile ? "participant_confirmed" : "unknown",
    });
  }

  const responseTime = cognitive.responseTimeMinimumSeconds ?? digital.responseTimeMinimumSeconds;
  if (typeof responseTime === "number" && responseTime > 0) {
    requirements.push({
      id: "req-response-time",
      kind: "response_time",
      value: responseTime,
      instructions: `Allow at least ${responseTime} seconds before repeating or moving on.`,
      evidenceClass: profile ? "participant_confirmed" : "unknown",
    });
  }

  if (prefs.includes("plain_language") || cognitive.plainLanguage === true) {
    if (!requirements.some((r) => r.kind === "plain_language")) {
      requirements.push({
        id: "req-plain-language",
        kind: "plain_language",
        value: true,
        evidenceClass: "self_declared",
      });
    }
  }

  const authored =
    options?.participantAuthoredInstructions ??
    asStringArray(cognitive.communicationInstructions);

  const evidenceClass =
    authored.length > 0
      ? ("participant_confirmed" as const)
      : prefs.length > 0
        ? ("self_declared" as const)
        : ("unknown" as const);

  return {
    id: profile ? `comm-passport-${profile.id}` : `comm-passport-${participantId}`,
    participantId,
    state: authored.length > 0 || prefs.length > 0 ? "active" : "draft",
    participantAuthoredInstructions: authored,
    requirements,
    capacityImplication: "none",
    consentImplication: "none",
    source: {
      accessibilityProfileId: profile?.id ?? null,
      projectedFrom: "AccessibilityProfile",
      competingProfile: false,
    },
    evidenceClass,
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
    isSynthetic: options?.isSynthetic,
    updatedAt:
      typeof profile?.updatedAt === "string"
        ? profile.updatedAt
        : profile?.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}
