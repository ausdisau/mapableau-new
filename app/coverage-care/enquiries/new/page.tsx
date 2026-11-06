import { CoverageCareDisabledState } from "@/components/coverage-care/DisabledState";
import { EnquiryWizard } from "@/components/coverage-care/EnquiryWizard";
import { isCoverageCareSurfaceEnabled } from "@/lib/coverage-care/flag-gate";
import { getCoverageCareListing } from "@/lib/coverage-care/listing-service";

export default async function NewEnquiryPage({
  searchParams,
}: {
  searchParams?: Promise<{ listingId?: string }>;
}) {
  if (!isCoverageCareSurfaceEnabled()) {
    return <CoverageCareDisabledState />;
  }

  const resolved = (await searchParams) ?? {};
  const listingId = resolved.listingId;
  const listing = listingId ? getCoverageCareListing(listingId) : null;

  return (
    <EnquiryWizard
      listingId={listing?.id}
      listingTitle={listing?.title}
    />
  );
}
