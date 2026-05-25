import { Suspense } from "react";

import ProviderFinderClient from "@/app/provider-finder/ProviderFinderClient";

export default function EmbedProviderFinderPage() {
  return (
    <Suspense
      fallback={
        <p className="container mx-auto px-4 py-12 text-muted-foreground">
          Loading provider finder…
        </p>
      }
    >
      <ProviderFinderClient />
    </Suspense>
  );
}
