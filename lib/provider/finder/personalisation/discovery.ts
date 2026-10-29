import type { CurrentUser } from "@/lib/auth/current-user";
import type { CopilotProviderResult } from "@/lib/copilot/types";
import { prisma } from "@/lib/prisma";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";

import {
  rankDirectoryProvider,
  rankPublishedWorker,
  type FinderDiscoveryMatch,
  type FinderDiscoveryPayload,
  type FinderSavedPreference,
  type FinderSearchScope,
} from "./matching";

const WORKER_CANDIDATE_LIMIT = 80;

export async function loadFinderPreference(user: CurrentUser | null): Promise<FinderSavedPreference | null> {
  if (!user) return null;
  return prisma.providerFinderPreference.findUnique({
    where: { userId: user.id },
    select: { enabled: true, location: true, supportType: true, language: true },
  });
}

export function applySavedFinderPreference(
  fields: { location: string; serviceQuery: string },
  preference: FinderSavedPreference | null,
): { location: string; serviceQuery: string } {
  if (!preference?.enabled) return fields;
  return {
    location: fields.location || preference.location || "",
    serviceQuery: fields.serviceQuery || preference.supportType || "",
  };
}

export async function findFinderDiscoveryMatches(options: {
  user: CurrentUser | null;
  scope: FinderSearchScope;
  applied: AppliedSearchFields;
  providerResults: CopilotProviderResult[];
  preference: FinderSavedPreference | null;
}): Promise<FinderDiscoveryPayload> {
  const { user, scope, applied, providerResults, preference } = options;
  const personalised = Boolean(user && preference?.enabled);
  const effectivePreference = personalised ? preference : null;

  const matches: FinderDiscoveryMatch[] = [];
  if (scope !== "workers") {
    const rankedProviders = providerResults.map((provider) =>
      rankDirectoryProvider(provider, effectivePreference));
    rankedProviders.sort((a, b) => b.score - a.score || a.match.name.localeCompare(b.match.name));
    matches.push(...rankedProviders.slice(0, 10).map((item) => item.match));
  }

  let workerNotice = "Worker results are available after sign-in and individual worker publication consent.";
  if (scope !== "providers" && user) {
    // Not a worker-screening check: use only profiles with explicit, revocable publication consent.
    const candidates = await prisma.workerProfile.findMany({
      where: {
        active: true,
        directoryPublication: { is: { published: true, consentedAt: { not: null } } },
      },
      select: {
        id: true,
        displayName: true,
        profileSummary: true,
        serviceTypes: true,
        serviceRegions: true,
        languages: true,
      },
      take: WORKER_CANDIDATE_LIMIT,
      orderBy: { displayName: "asc" },
    });

    const ranked = candidates.flatMap((candidate) => {
      const fit = rankPublishedWorker(candidate, {
        explicitService: applied.serviceQuery,
        explicitLocation: applied.location,
        preferredService: effectivePreference?.supportType,
        preferredLocation: effectivePreference?.location,
        preferredLanguage: effectivePreference?.language,
      });
      if (!fit) return [];
      const match: FinderDiscoveryMatch = {
        kind: "worker",
        id: candidate.id,
        name: candidate.displayName,
        location: candidate.serviceRegions.join(", ") || "Service region not declared",
        services: candidate.serviceTypes.slice(0, 6),
        reasons: fit.reasons,
        source: "Worker-published MapAble directory profile",
        caution: "This is self-published profile information. Screening, competence, availability and employer association are not independently verified.",
      };
      return [{ score: fit.score, match }];
    });
    ranked.sort((a, b) => b.score - a.score || a.match.name.localeCompare(b.match.name));
    matches.push(...ranked.slice(0, 10).map((item) => item.match));
    workerNotice = ranked.length
      ? "Worker results include only profiles explicitly published by their owners. Verify screening through an authorised NDIS Worker Screening Database pathway."
      : "No opted-in worker profiles matched. This does not mean no suitable workers exist.";
  }
  return { matches, scope, personalised, workerNotice };
}
