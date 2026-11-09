/** Deterministic privacy and evidence gates for live MapAble Community. */
export type ConsentScope = "private" | "review" | "public";
export type ModerationStatus = "pending" | "needs_info" | "rejected" | "approved" | "withdrawn";

export interface PublicationState {
  consentScope: string;
  moderation: string;
  consentWithdrawnAt: Date | null;
  challengeStatus: string;
}

export function canPublishFinding(record: PublicationState): boolean {
  return record.consentScope === "public" &&
    record.moderation === "approved" &&
    record.consentWithdrawnAt === null &&
    record.challengeStatus === "published";
}

/** Moderators cannot inspect private workspaces; review consent is not publication consent. */
export function canModerateFinding(scope: string, withdrawnAt: Date | null): boolean {
  return (scope === "review" || scope === "public") && withdrawnAt === null;
}

export function mayApprovePublicFinding(scope: string, authorId: string, reviewerId: string): boolean {
  return scope === "public" && authorId !== reviewerId;
}

/** Never publish author IDs, raw coordinates, attachments, contact information or notes. */
export function publicFinding<T extends {
  id: string; challengeId: string; title: string; feature: string;
  finding: string; method: string; observedAt: Date; evidenceState: string;
  rating: string; createdAt: Date;
}>(row: T) {
  return {
    id: row.id,
    challengeId: row.challengeId,
    title: row.title,
    feature: row.feature,
    finding: row.finding,
    method: row.method,
    observedAt: row.observedAt.toISOString().slice(0, 10),
    evidenceState: row.evidenceState,
    rating: row.rating,
    createdAt: row.createdAt.toISOString(),
    qualification: "Community report reviewed for publication; not independent verification or a guarantee of accessibility",
  };
}

/** Browser mutation requests must originate on the exact application origin. */
export function validMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    return source.origin === target.origin && ["https:", "http:"].includes(source.protocol);
  } catch {
    return false;
  }
}

export const COMMUNITY_CONSENT_VERSION = "community-signal-2026-11-v1";
export const COMMUNITY_DEFAULT_RATING = "unknown" as const;
