import { ContinuityStubPage } from "@/components/continuity/ContinuityStubPage";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  return (
    <ContinuityStubPage
      title="Continuity cases"
      intro="Open cases affecting your services. A case is opened before any linked service is changed."
    />
  );
}
