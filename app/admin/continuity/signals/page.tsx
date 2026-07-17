import { ContinuityStubPage } from "@/components/continuity/ContinuityStubPage";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  return (
    <ContinuityStubPage
      title="Continuity signals"
      intro="Signals received, deduped, and validated. Stale signals cannot drive destructive action."
    />
  );
}
