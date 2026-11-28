import type {
  CouncilBoundarySource,
  CouncilJurisdiction,
  CouncilLinkage,
  CouncilSourceLink,
} from "@/lib/access/community-infrastructure/council-types";
import type { CommunityCategory } from "@/lib/access/community-infrastructure/types";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

import { COMMUNITY_CATEGORY_LABELS, communityDateLabel } from "./presentation";

const councilLinkClass = `inline-flex min-h-11 items-center rounded-lg font-semibold text-[#005B7F] underline underline-offset-4 ${mapableInteractiveFocusRing}`;

function readableValue(value: string) {
  return value.replaceAll("_", " ");
}

function categoryLabel(category: string) {
  return (
    COMMUNITY_CATEGORY_LABELS[category as CommunityCategory] ??
    readableValue(category)
  );
}

function preferredLinks(
  links: CouncilSourceLink[],
  category: CommunityCategory | "all",
) {
  if (category === "all") return links.slice(0, 2);
  return [
    ...links.filter((link) => link.categories.includes(category)),
    ...links.filter((link) => !link.categories.includes(category)),
  ].slice(0, 2);
}

export function CommunityCouncilInformation({
  linkage,
  areaLabel,
  category,
  loading,
}: {
  linkage?: CouncilLinkage;
  areaLabel: string;
  category: CommunityCategory | "all";
  loading: boolean;
}) {
  return (
    <section
      aria-labelledby="community-council-title"
      className="rounded-2xl border border-slate-200 p-5 text-sm leading-6"
    >
      <h2 id="community-council-title" className="font-bold">
        Council information
      </h2>
      {loading ? (
        <p className="mt-2 text-slate-600">Loading council information…</p>
      ) : !linkage ? (
        <p className="mt-2 text-slate-600">
          Council boundary information is not available for these records. A
          council is not inferred from the study-area name.
        </p>
      ) : (
        <>
          <p className="mt-2 text-slate-600">
            Counts cover the whole {areaLabel} study window, before place-type
            and wheelchair-tag filters.
          </p>
          <ul className="mt-3 divide-y divide-slate-200">
            {linkage.councils.map((council) => (
              <li key={council.id} className="py-3 first:pt-0">
                <h3 className="font-semibold">{council.name}</h3>
                <p className="text-slate-600">
                  {council.featureCount} mapped record
                  {council.featureCount === 1 ? "" : "s"} matched by marker
                  location
                </p>
                <ul>
                  {preferredLinks(council.sourceLinks, category).map((link) => (
                    <li key={link.id}>
                      <a href={link.url} className={councilLinkClass}>
                        {link.title}
                      </a>
                    </li>
                  ))}
                  {council.sourceLinks.length === 0 && council.website ? (
                    <li>
                      <a href={council.website} className={councilLinkClass}>
                        Visit {council.name}
                      </a>
                    </li>
                  ) : null}
                </ul>
              </li>
            ))}
          </ul>
          {linkage.councils.length === 0 ? (
            <p className="mt-2 text-slate-600">
              No council area has been established for records in this study
              window.
            </p>
          ) : null}
          <p className="mt-2 text-slate-600">
            Geographic jurisdiction does not establish who owns or operates a
            facility.
          </p>
          {linkage.ambiguousFeatureCount > 0 ||
          linkage.unmatchedFeatureCount > 0 ||
          linkage.notJoinedFeatureCount > 0 ? (
            <ul className="mt-2 text-slate-600">
              {linkage.ambiguousFeatureCount > 0 ? (
                <li>
                  Ambiguous boundary matches: {linkage.ambiguousFeatureCount}
                </li>
              ) : null}
              {linkage.unmatchedFeatureCount > 0 ? (
                <li>No boundary match: {linkage.unmatchedFeatureCount}</li>
              ) : null}
              {linkage.notJoinedFeatureCount > 0 ? (
                <li>Not joined: {linkage.notJoinedFeatureCount}</li>
              ) : null}
            </ul>
          ) : null}

          <details className="mt-3 border-t border-slate-200 pt-1">
            <summary
              className={`min-h-11 cursor-pointer rounded-lg py-3 font-semibold ${mapableInteractiveFocusRing}`}
            >
              Source and reuse details
            </summary>
            <p className="text-slate-600">{linkage.notice}</p>
            <h3 className="mt-3 font-semibold">Council boundaries</h3>
            <a href={linkage.boundarySource.url} className={councilLinkClass}>
              {linkage.boundarySource.name}
            </a>
            <p className="text-slate-600">
              {linkage.boundarySource.publisher} · Retrieved{" "}
              {communityDateLabel(linkage.boundarySource.retrievedAt)}
            </p>
            <a
              href={linkage.boundarySource.licenceUrl}
              className={councilLinkClass}
            >
              Boundary data licence: {linkage.boundarySource.licence}
            </a>
            <p className="text-slate-600">
              {linkage.boundarySource.attribution}
            </p>
            <h3 className="mt-4 font-semibold">Council facility information</h3>
            <p className="mt-1 text-slate-600">
              These are reference links. Bulk reuse rights for council facility
              information are not established, and that information has not been
              imported into this layer. The boundary licence does not cover the
              linked council pages.
            </p>
            {linkage.councils.map((council) => (
              <div key={council.id} className="mt-4">
                <h4 className="font-semibold">{council.name}</h4>
                <ul className="divide-y divide-slate-200">
                  {council.sourceLinks.map((link) => (
                    <li key={link.id} className="py-3">
                      <a href={link.url} className={councilLinkClass}>
                        {link.title}
                      </a>
                      <dl className="space-y-1 text-slate-600">
                        <div>
                          <dt className="font-semibold">Topics</dt>
                          <dd>
                            {link.categories.map(categoryLabel).join(", ")}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Source type</dt>
                          <dd>{readableValue(link.sourceKind)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Page retrieval</dt>
                          <dd>{readableValue(link.retrievalStatus)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Link reviewed</dt>
                          <dd>{communityDateLabel(link.reviewedAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Source page updated</dt>
                          <dd>{communityDateLabel(link.sourceUpdatedAt)}</dd>
                        </div>
                      </dl>
                      <p className="mt-2 text-slate-600">{link.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        </>
      )}
    </section>
  );
}

export function CouncilJurisdictionSummary({
  jurisdiction,
  approximate,
}: {
  jurisdiction?: CouncilJurisdiction;
  approximate: boolean;
}) {
  const names = jurisdiction?.matches.map((match) => match.councilName) ?? [];
  const matched = jurisdiction?.status === "matched" && names.length === 1;
  return (
    <div className="mt-3 text-sm text-slate-600">
      <p>
        <span className="font-semibold">
          {matched
            ? approximate
              ? "Council area at approximate marker"
              : "Council area at mapped point"
            : "Council area"}
          :{" "}
        </span>
        {!jurisdiction
          ? "Not joined"
          : jurisdiction.status === "ambiguous"
            ? "Ambiguous boundary match"
            : jurisdiction.status === "unmatched"
              ? "No boundary match"
              : names.length === 1
                ? names[0]
                : "Not established"}
      </p>
      {jurisdiction?.status === "ambiguous" ? (
        <p className="mt-1">
          More than one council area matches this marker: {names.join(", ")}.
        </p>
      ) : jurisdiction?.status === "unmatched" ? (
        <p className="mt-1">
          No council area was matched in the loaded boundary data.
        </p>
      ) : matched && approximate ? (
        <p className="mt-1">
          The feature may extend beyond this council area. Its entrance is not
          established by this marker.
        </p>
      ) : null}
    </div>
  );
}

export function CouncilJurisdictionEvidence({
  jurisdiction,
  boundarySource,
}: {
  jurisdiction?: CouncilJurisdiction;
  boundarySource?: CouncilBoundarySource;
}) {
  if (!jurisdiction) return null;
  return (
    <>
      <div>
        <dt className="font-semibold">Council boundary method</dt>
        <dd>Displayed point tested against council boundaries</dd>
      </div>
      <div>
        <dt className="font-semibold">Boundary data retrieved</dt>
        <dd>{communityDateLabel(jurisdiction.boundaryRetrievedAt)}</dd>
      </div>
      {boundarySource?.id === jurisdiction.boundarySourceId ? (
        <div>
          <dt className="font-semibold">Boundary source</dt>
          <dd>
            <a href={boundarySource.url} className={councilLinkClass}>
              {boundarySource.name}
            </a>
          </dd>
        </div>
      ) : null}
      <div>
        <dt className="font-semibold">Facility ownership or operation</dt>
        <dd>Not established by council boundary matching</dd>
      </div>
    </>
  );
}
