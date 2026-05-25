import { Suspense } from "react";

import { ProviderFinder } from "@/components/providers/ProviderFinder";
import { PageContainer } from "@/components/layout/PageContainer";

export const metadata = {
  title: "Find providers | MapAble",
};

export default function ProvidersPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <p className="text-muted-foreground">Loading provider finder…</p>
        }
      >
        <ProviderFinder />
      </Suspense>
    </PageContainer>
  );
}
