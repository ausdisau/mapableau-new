import { redirect, notFound } from "next/navigation";

import { LifeIntentDetailClient } from "@/components/personal-agency/LifeIntentDetailClient";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { requireLifeIntentGate } from "@/lib/personal-agency/gates";
import { getLifeIntentForPrincipal } from "@/lib/personal-agency/life-intent-service";

export const metadata = { title: "Life intent | My MapAble" };

export default async function LifeIntentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!personalAgencyFlags.lifeIntentsEnabled) redirect("/my");
  const user = await requireLifeIntentGate();
  const { id } = await params;

  try {
    const intent = await getLifeIntentForPrincipal(id, user.id);
    return (
      <LifeIntentDetailClient
        intent={{
          id: intent.id,
          originalExpression: intent.originalExpression,
          status: intent.status,
        }}
      />
    );
  } catch {
    notFound();
  }
}
