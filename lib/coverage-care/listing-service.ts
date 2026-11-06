import { ensureCoverageCareEnabled } from "@/lib/config/coverage-care";
import { getCoverageCareMemoryState } from "@/lib/coverage-care/store/memory-store";
import { getCoverageCareTenant } from "@/lib/coverage-care/tenant-context";
import type { CoverageCareServiceListing } from "@/lib/coverage-care/types";

export interface ListServicesInput {
  tenantId?: string;
  discipline?: string;
  regionQuery?: string;
}

export function listCoverageCareServices(
  input: ListServicesInput = {},
): CoverageCareServiceListing[] {
  ensureCoverageCareEnabled();
  const tenantId = input.tenantId ?? getCoverageCareTenant().id;
  const discipline = input.discipline?.trim().toLowerCase();
  const regionQuery = input.regionQuery?.trim().toLowerCase();

  return getCoverageCareMemoryState()
    .listings.filter((listing) => listing.tenantId === tenantId)
    .filter((listing) =>
      discipline
        ? listing.discipline.toLowerCase().includes(discipline)
        : true,
    )
    .filter((listing) =>
      regionQuery ? listing.region.toLowerCase().includes(regionQuery) : true,
    )
    .map((listing) => ({ ...listing }));
}

export function getCoverageCareListing(
  listingId: string,
  tenantId?: string,
): CoverageCareServiceListing | null {
  ensureCoverageCareEnabled();
  const scopedTenantId = tenantId ?? getCoverageCareTenant().id;
  const listing = getCoverageCareMemoryState().listings.find(
    (item) => item.id === listingId && item.tenantId === scopedTenantId,
  );
  return listing ? { ...listing } : null;
}

export function assertListingIsSyntheticDemo(
  listing: CoverageCareServiceListing,
): void {
  if (listing.provenance !== "synthetic_demo") {
    throw new Error("UNVERIFIED_LISTING_PROVENANCE");
  }
}
