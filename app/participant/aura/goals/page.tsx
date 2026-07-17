import Link from "next/link";

import { AuraDisclaimerBanner } from "@/components/aura/AuraDisclaimerBanner";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantAuraGoalsPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <p>
        <Link href="/participant/aura" className="text-sm underline">
          Back to AURA
        </Link>
      </p>
      <h1 className="font-heading text-xl font-bold">Goals</h1>
      <AuraDisclaimerBanner scope="participant" />
      <p className="text-sm">
        This surface is scoped to your account. No AURA action runs without an
        approved authority envelope; nothing is auto-saved from model output;
        pausing AURA takes effect immediately.
      </p>
    </div>
  );
}
