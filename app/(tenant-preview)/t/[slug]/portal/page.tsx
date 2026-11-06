import Link from "next/link";

import { resolveCoverageCareParticipant } from "@/lib/coverage-care/demo-actor";
import { listParticipantEnquiries } from "@/lib/coverage-care/enquiry-service";
import { listSyntheticDelegates } from "@/lib/coverage-care/tenant-context";

export default async function TenantPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const participant = await resolveCoverageCareParticipant();
  if (!participant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[color:var(--cc-olive)]">
          Sign in required
        </h1>
        <p className="mt-3">
          Enable <code>MAPABLE_COVERAGE_CARE_DEMO_ACTOR=true</code> for the local
          synthetic actor, or sign in as a participant.
        </p>
      </div>
    );
  }

  const enquiries = listParticipantEnquiries(participant.id);
  const delegates = listSyntheticDelegates(participant.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
            My enquiries
          </h1>
          <p className="mt-2 text-[color:var(--cc-ink)]/75">
            Review sharing, amend drafts, withdraw consent, or delete records.
          </p>
        </div>
        <Link
          href={`/t/${slug}/enquire`}
          className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
        >
          New enquiry
        </Link>
      </div>

      {delegates.length > 0 ? (
        <aside className="mt-6 rounded-md border border-[color:var(--cc-sage)]/40 bg-white px-4 py-3 text-sm">
          <p className="font-medium">Synthetic delegate grants</p>
          <ul className="mt-2 list-disc pl-5">
            {delegates.map((d) => (
              <li key={d.id}>
                Scope <code>{d.scope}</code> expires{" "}
                <time dateTime={d.expiresAt}>{d.expiresAt}</time>
                {d.revokedAt ? " (revoked)" : ""} — not a permission bypass.
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <ul className="mt-8 space-y-3" aria-label="Participant enquiries">
        {enquiries.map((enquiry) => (
          <li
            key={enquiry.id}
            className="rounded-md border border-[color:var(--cc-sage)]/30 bg-white px-4 py-4"
          >
            <Link
              href={`/t/${slug}/portal/${enquiry.id}`}
              className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            >
              <span className="font-medium text-[color:var(--cc-olive)]">
                Enquiry {enquiry.id.slice(0, 12)}…
              </span>
              <span className="mt-1 block text-sm text-[color:var(--cc-ink)]/70">
                Status: {enquiry.status.replaceAll("_", " ")}
                {enquiry.providerStatus
                  ? ` · provider: ${enquiry.providerStatus.replaceAll("_", " ")}`
                  : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
