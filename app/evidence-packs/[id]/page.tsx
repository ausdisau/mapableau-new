import { notFound } from "next/navigation";

import { EvidencePackBuilder } from "@/components/evidence-packs/EvidencePackBuilder";
import { EvidencePackPreview } from "@/components/evidence-packs/EvidencePackPreview";
import { requireAuth } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getEvidencePack } from "@/lib/evidence-packs/evidence-pack-service";

export default async function EvidencePackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const user = await getCurrentUser();
  if (!user) notFound();
  const { id } = await params;
  let pack;
  try {
    pack = await getEvidencePack(id, user);
  } catch {
    notFound();
  }
  if (!pack) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">{pack.title}</h1>
      <EvidencePackPreview title={pack.title} />
      <EvidencePackBuilder packId={pack.id} />
    </div>
  );
}
