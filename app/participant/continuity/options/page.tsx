import { ContinuityStubPage } from "@/components/continuity/ContinuityStubPage";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  return (
    <ContinuityStubPage
      title="Recovery options"
      intro="Options a coordinator (or AURA) has drafted for your review. You choose — including choosing to do nothing."
    />
  );
}
