import { Suspense } from "react";

import { WorkerSearchPageClient } from "./WorkerSearchPageClient";

export default function WorkerSearchPage() {
  return (
    <Suspense
      fallback={
        <p className="container mx-auto px-4 py-12 text-muted-foreground">
          Loading worker search…
        </p>
      }
    >
      <WorkerSearchPageClient />
    </Suspense>
  );
}
