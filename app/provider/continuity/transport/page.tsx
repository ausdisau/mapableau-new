import { ContinuityStubPage } from "@/components/continuity/ContinuityStubPage";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  return (
    <ContinuityStubPage
      title="Transport continuity"
      intro="Transport-side continuity events. Cancellations here also open a case; they do not auto-cascade."
    />
  );
}
