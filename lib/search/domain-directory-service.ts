import "server-only";

import { prisma } from "@/lib/prisma";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import {
  importedProviderHits,
  type MapAbleSearchHit,
  type MapAbleSearchInput,
} from "@/lib/search/mapable-search-core";
import {
  categoryAllowsSource,
  directoryCategory,
  type DirectoryDomain,
} from "@/lib/search/domain-directory-taxonomy";

export type DomainDirectoryResult = {
  results: MapAbleSearchHit[];
  providerIndexUsed: boolean;
  publishedJobsUsed: boolean;
  incomplete: boolean;
  warnings: string[];
};

export function approvedEmployerIds(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.MAPABLE_SEARCH_PUBLISHED_JOBS_ENABLED !== "true") return [];
  // A published status alone is not a proof of employer consent or non-demo provenance.
  return Array.from(
    new Set(
      (env.MAPABLE_SEARCH_PUBLISHED_JOB_ORG_IDS ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => /^[A-Za-z0-9_-]{8,64}$/.test(item)),
    ),
  ).slice(0, 50);
}

/**
 * Public discovery only, with no use of private participant, applicant or
 * patient records. No search input goes to Exa/Parallel or an LLM.
 * Provider index and employer listings are independently default OFF.
 */
export async function searchDomainDirectory(
  input: MapAbleSearchInput & { domain: DirectoryDomain },
): Promise<DomainDirectoryResult> {
  const { domain } = input;
  const category = directoryCategory(domain, input.category);
  const warnings: string[] = [];
  const results: MapAbleSearchHit[] = [];
  let incomplete = false;
  let providerIndexUsed = false;
  let publishedJobsUsed = false;
  const providerIndexEnabled = process.env.MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED === "true";

  if (categoryAllowsSource(category, "providers")) {
    if (!providerIndexEnabled) {
      warnings.push(
        "Imported provider-outlet search is not enabled. No provider listings are presented as verified or available.",
      );
    } else {
      try {
        const { providers } = await searchNdisProviders({
          q: input.q.trim() || undefined,
          state: input.state,
          postcode: input.postcode,
          registrationGroups: category.registrationGroups,
          serviceLabels: category.serviceLabels,
          includeServiceText: true,
          limit: 30,
        });
        providerIndexUsed = true;
        results.push(
          ...importedProviderHits(providers).map((hit): MapAbleSearchHit => ({
            ...hit,
            id: domain + ":" + hit.id,
            vertical: domain,
            category: category.id === "all"
              ? domain === "jobs" ? "employment_support" : "therapy"
              : category.id,
            description:
              hit.description +
              " Service category comes from an imported directory, not a verified practitioner or available appointment.",
          })),
        );
      } catch {
        incomplete = true;
        warnings.push(
          "The imported provider-outlet index is currently unavailable. These results may be incomplete.",
        );
      }
    }
  }

  if (domain === "jobs" && categoryAllowsSource(category, "jobs")) {
    if (input.state || input.postcode) {
      // Current Job.location is unstructured, so state/postcode filtering
      // would create false geographic assertions.
      warnings.push(
        "Published jobs were not included with state or postcode filters: their locations are not yet structured or independently verified.",
      );
    } else {
      const employerIds = approvedEmployerIds();
      if (!employerIds.length) {
        warnings.push(
          "Public vacancies are not enabled for approved employer organisations in this environment.",
        );
      } else {
        try {
          const jobs = await prisma.job.findMany({
            where: {
              status: "published",
              employerOrganisationId: { in: employerIds },
              employerOrganisation: { status: "active" },
              ...(category.id === "workplace_adjustments"
                ? { adjustmentOpennessStatement: { not: null } }
                : {}),
              ...(input.q.trim()
                ? {
                    OR: [
                      { title: { contains: input.q.trim(), mode: "insensitive" } },
                      { description: { contains: input.q.trim(), mode: "insensitive" } },
                      { location: { contains: input.q.trim(), mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            select: {
              id: true,
              title: true,
              location: true,
              employmentType: true,
              remoteAllowed: true,
              adjustmentOpennessStatement: true,
              employerOrganisation: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 30,
          });
          publishedJobsUsed = true;
          for (const job of jobs) {
            const attributes = [
              job.employerOrganisation.name,
              job.location ?? "Location not stated",
              job.remoteAllowed ? "Employer describes remote work" : null,
              job.adjustmentOpennessStatement
                ? "Employer has provided an adjustment statement"
                : null,
            ].filter(Boolean);
            results.push({
              id: "job:" + job.id,
              kind: "published_job",
              vertical: "jobs",
              category: job.adjustmentOpennessStatement
                ? "workplace_adjustments" : "job_vacancies",
              title: job.title,
              description: attributes.join(" · ") +
                ". Details and adjustment claims come from the publishing employer.",
              href: "/employment/directory/jobs/" + encodeURIComponent(job.id),
              provenance: "approved_employer_listing",
              sourceLabel: "MapAble published job from an explicitly approved employer organisation",
              registration: "not_independently_verified",
              workerScreening: "not_independently_verified",
              accessFit: "unknown",
              availability: "unknown",
            });
          }
        } catch {
          incomplete = true;
          warnings.push(
            "Published job records could not be loaded. This is not evidence that no vacancies exist.",
          );
        }
      }
    }
  }

  warnings.push(
    "Directory presence is not proof of clinical registration, worker screening, NDIS registration, access fit, capacity, suitability, job availability or funding approval.",
  );
  return { results, providerIndexUsed, publishedJobsUsed, incomplete, warnings };
}
