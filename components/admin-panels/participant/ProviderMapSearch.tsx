import Link from "next/link";

import { PanelSection } from "@/components/admin-panels/PanelSection";

export function ProviderMapSearch() {
  return (
    <PanelSection
      title="Find providers on the map"
      description="Search verified disability service providers by location and access needs."
    >
      <p className="text-sm text-muted-foreground">
        Use the provider finder to view organisations on an accessible map and request
        bookings when they are booking eligible.
      </p>
      <Link
        href="/provider-finder"
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Open provider finder map
      </Link>
    </PanelSection>
  );
}
