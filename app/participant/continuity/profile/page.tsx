import { ContinuityStubPage } from "@/components/continuity/ContinuityStubPage";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  return (
    <ContinuityStubPage
      title="My continuity profile"
      intro="Your goals, essential supports, and communication preferences. Essential supports are always defined by you or an authorised human — never inferred from a diagnosis."
    />
  );
}
