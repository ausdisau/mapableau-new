import { CoverageCareDisabledState } from "@/components/coverage-care/DisabledState";
import { resolveCoverageCareProviderAdmin } from "@/lib/coverage-care/demo-actor";
import { isCoverageCareSurfaceEnabled } from "@/lib/coverage-care/flag-gate";
import { getCoverageCareNdiaReadiness } from "@/lib/coverage-care/ndia-readiness";

export default async function NdiaReadinessPage() {
  if (!isCoverageCareSurfaceEnabled()) {
    return <CoverageCareDisabledState />;
  }

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold">Provider admin required</h1>
      </div>
    );
  }

  const readiness = getCoverageCareNdiaReadiness();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        NDIA Integration Gateway readiness
      </h1>
      <p className="mt-2 text-[color:var(--cc-ink)]/75">
        Disabled readiness panel wrapping MapAble&apos;s official claims
        gateway. Live submission stays off.
      </p>
      <dl className="mt-8 space-y-4 rounded-md border border-[color:var(--cc-sage)]/30 bg-white p-5">
        <div>
          <dt className="font-medium">Gateway</dt>
          <dd>{readiness.gatewayName}</dd>
        </div>
        <div>
          <dt className="font-medium">Status</dt>
          <dd className="uppercase tracking-wide">{readiness.status}</dd>
        </div>
        <div>
          <dt className="font-medium">Live submission</dt>
          <dd>{String(readiness.liveSubmissionEnabled)}</dd>
        </div>
        <div>
          <dt className="font-medium">Summary</dt>
          <dd>{readiness.summary}</dd>
        </div>
        <div>
          <dt className="font-medium">Blockers</dt>
          <dd>
            <ul className="list-disc space-y-1 pl-5">
              {readiness.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-medium">Checked at</dt>
          <dd>
            <time dateTime={readiness.checkedAt}>{readiness.checkedAt}</time>
          </dd>
        </div>
      </dl>
    </div>
  );
}
