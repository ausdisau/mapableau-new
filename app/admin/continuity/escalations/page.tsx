import { ContinuityStubPage } from "@/components/continuity/ContinuityStubPage";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  return (
    <ContinuityStubPage
      title="Escalations"
      intro="Cases handed off to a human. AURA cannot close them."
    />
  );
}
