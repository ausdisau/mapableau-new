import Link from "next/link";

import { CoverageCareDisabledState } from "@/components/coverage-care/DisabledState";
import { resolveCoverageCareParticipant } from "@/lib/coverage-care/demo-actor";
import { listParticipantEnquiries } from "@/lib/coverage-care/enquiry-service";
import { isCoverageCareSurfaceEnabled } from "@/lib/coverage-care/flag-gate";

export default async function ParticipantEnquiriesPage() {
  if (!isCoverageCareSurfaceEnabled()) {
    return <CoverageCareDisabledState />;
  }

  const participant = await resolveCoverageCareParticipant();
  if (!participant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[color:var(--cc-olive)]">
          Sign in required
        </h1>
        <p className="mt-3 text-[color:var(--cc-ink)]/80">
          Sign in as a participant, or enable{" "}
          <code>MAPABLE_COVERAGE_CARE_DEMO_ACTOR=true</code> for the local
          synthetic actor.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
        >
          Go to login
        </Link>
      </div>
    );
  }

  const enquiries = listParticipantEnquiries(participant.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
            My enquiries
          </h1>
          <p className="mt-2 text-[color:var(--cc-ink)]/75">
            Review sharing, withdraw consent, or delete records.
          </p>
        </div>
        <Link
          href="/coverage-care/enquiries/new"
          className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
        >
          New enquiry
        </Link>
      </div>

      <ul className="mt-8 space-y-3" aria-label="Participant enquiries">
        {enquiries.map((enquiry) => (
          <li
            key={enquiry.id}
            className="rounded-md border border-[color:var(--cc-sage)]/30 bg-white px-4 py-4"
          >
            <Link
              href={`/coverage-care/enquiries/${enquiry.id}`}
              className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            >
              <span className="font-medium text-[color:var(--cc-olive)]">
                Enquiry {enquiry.id.slice(0, 12)}…
              </span>
              <span className="mt-1 block text-sm text-[color:var(--cc-ink)]/70">
                Status: {enquiry.status.replaceAll("_", " ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {enquiries.length === 0 ? (
        <p className="mt-8 text-[color:var(--cc-ink)]/75" role="status">
          No enquiries yet.{" "}
          <Link
            href="/coverage-care/services"
            className="underline underline-offset-4"
          >
            Explore services
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
