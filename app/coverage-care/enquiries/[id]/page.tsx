import Link from "next/link";
import { notFound } from "next/navigation";

import { CoverageCareDisabledState } from "@/components/coverage-care/DisabledState";
import { EnquiryControls } from "@/components/coverage-care/EnquiryControls";
import { isAdminRole } from "@/lib/auth/roles";
import { resolveCoverageCareParticipant } from "@/lib/coverage-care/demo-actor";
import { getCoverageCareEnquiry } from "@/lib/coverage-care/enquiry-service";
import { isCoverageCareSurfaceEnabled } from "@/lib/coverage-care/flag-gate";
import { getCoverageCareListing } from "@/lib/coverage-care/listing-service";
import { CoverageCarePermissionError } from "@/lib/coverage-care/permissions";

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isCoverageCareSurfaceEnabled()) {
    return <CoverageCareDisabledState />;
  }

  const resolved = await Promise.resolve(params);
  const participant = await resolveCoverageCareParticipant();
  if (!participant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[color:var(--cc-olive)]">
          Sign in required
        </h1>
      </div>
    );
  }

  let enquiry;
  try {
    enquiry = getCoverageCareEnquiry(resolved.id);
  } catch (error) {
    if (error instanceof CoverageCarePermissionError) notFound();
    throw error;
  }
  if (!enquiry) notFound();
  if (
    enquiry.participantUserId !== participant.id &&
    !isAdminRole(participant.primaryRole)
  ) {
    notFound();
  }

  const listing = enquiry.listingId
    ? getCoverageCareListing(enquiry.listingId)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p>
        <Link
          href="/coverage-care/enquiries"
          className="text-sm font-medium text-[color:var(--cc-olive)] underline underline-offset-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
        >
          Back to my enquiries
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-[color:var(--cc-olive)]">
        Enquiry details
      </h1>
      <dl className="mt-6 space-y-3 text-base">
        <div>
          <dt className="font-medium">Status</dt>
          <dd>{enquiry.status.replaceAll("_", " ")}</dd>
        </div>
        {listing ? (
          <div>
            <dt className="font-medium">Service</dt>
            <dd>
              {listing.title}{" "}
              <span className="text-sm text-[color:var(--cc-ink)]/70">
                (synthetic demo)
              </span>
            </dd>
          </div>
        ) : null}
        {enquiry.sharePreview ? (
          <div>
            <dt className="font-medium">Sharing preview</dt>
            <dd>
              Purpose: {enquiry.sharePreview.purpose}. Fields:{" "}
              {enquiry.sharePreview.fieldsShared.join(", ") || "none"}.
            </dd>
          </div>
        ) : null}
        {enquiry.providerNotes ? (
          <div>
            <dt className="font-medium">Provider notes</dt>
            <dd>{enquiry.providerNotes}</dd>
          </div>
        ) : null}
      </dl>
      <EnquiryControls enquiryId={enquiry.id} status={enquiry.status} />
    </div>
  );
}
