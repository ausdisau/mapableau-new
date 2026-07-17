import { ContinuityStubPage } from "@/components/continuity/ContinuityStubPage";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  return (
    <ContinuityStubPage
      title="Standing instructions"
      intro="Narrow, revocable rules you set for future disruptions. Rechecked at execution — they cannot authorise things you have prohibited."
    />
  );
}
