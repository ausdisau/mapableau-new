import { AccessibleEnquiry } from "@/components/tenants/AccessibleEnquiry";
import { getCoverageCareListing } from "@/lib/coverage-care/listing-service";

export default async function TenantEnquirePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ listingId?: string }>;
}) {
  const { slug } = await params;
  const resolved = (await searchParams) ?? {};
  const listing = resolved.listingId
    ? getCoverageCareListing(resolved.listingId)
    : null;

  return (
    <AccessibleEnquiry
      slug={slug}
      listingId={listing?.id}
      listingTitle={listing?.title}
    />
  );
}
