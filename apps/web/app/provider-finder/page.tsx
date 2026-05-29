import { Suspense } from "react";

import ProviderFinderClient from "./ProviderFinderClient";

export default function Page() {
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

