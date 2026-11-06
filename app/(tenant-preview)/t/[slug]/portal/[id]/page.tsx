import Link from "next/link";
import { notFound } from "next/navigation";

import { EnquiryControls } from "@/components/coverage-care/EnquiryControls";
import { resolveCoverageCareParticipant } from "@/lib/coverage-care/demo-actor";
import { getCoverageCareEnquiry } from "@/lib/coverage-care/enquiry-service";
import { getCoverageCareListing } from "@/lib/coverage-care/listing-service";
import { CoverageCarePermissionError } from "@/lib/coverage-care/permissions";

export default async function TenantEnquiryDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const participant = await resolveCoverageCareParticipant();
  if (!participant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
      </div>
    );
  }

  let enquiry;
  try {
    enquiry = getCoverageCareEnquiry(id);
  } catch (error) {
    if (error instanceof CoverageCarePermissionError) notFound();
    throw error;
  }
  if (!enquiry) notFound();
  if (enquiry.participantUserId !== participant.id) notFound();

  const listing = enquiry.listingId
    ? getCoverageCareListing(enquiry.listingId)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p>
        <Link
          href={`/t/${slug}/portal`}
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
        {enquiry.providerStatus ? (
          <div>
            <dt className="font-medium">Provider status</dt>
            <dd>{enquiry.providerStatus.replaceAll("_", " ")}</dd>
          </div>
        ) : null}
        {listing ? (
          <div>
            <dt className="font-medium">Service</dt>
            <dd>
              {listing.title}{" "}
              <span className="text-sm">({listing.publicationStatus})</span>
            </dd>
          </div>
        ) : null}
        {enquiry.sharePreview ? (
          <div>
            <dt className="font-medium">Sharing preview</dt>
            <dd>
              Channel: {enquiry.sharePreview.preferredChannel}. Purpose:{" "}
              {enquiry.sharePreview.purpose}. Fields:{" "}
              {enquiry.sharePreview.fieldsShared.join(", ") || "none"}.
              {enquiry.sharePreview.accessRequirements
                ? ` Access needs: ${enquiry.sharePreview.accessRequirements}`
                : ""}
            </dd>
          </div>
        ) : null}
        {enquiry.providerReply ? (
          <div>
            <dt className="font-medium">Provider reply</dt>
            <dd>
              {enquiry.providerReply}
              {enquiry.responderLabel
                ? ` — ${enquiry.responderLabel}`
                : ""}
            </dd>
          </div>
        ) : null}
      </dl>
      <EnquiryControls
        enquiryId={enquiry.id}
        status={enquiry.status}
        preferredChannel={enquiry.sharePreview?.preferredChannel ?? "email"}
        accessRequirements={enquiry.sharePreview?.accessRequirements ?? ""}
        participantNote={enquiry.sharePreview?.participantNote ?? ""}
        fieldsShared={enquiry.sharePreview?.fieldsShared}
        providerLabel={
          enquiry.sharePreview?.providerLabel ?? listing?.title ?? undefined
        }
      />
    </div>
  );
}
