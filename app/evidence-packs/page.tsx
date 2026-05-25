import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { listEvidencePacks } from "@/lib/evidence-packs/evidence-pack-service";

export default async function EvidencePacksPage() {
  const user = await requireAuth();
  let packs: Awaited<ReturnType<typeof listEvidencePacks>> = [];
  try {
    packs = await listEvidencePacks(user.id);
  } catch {
    packs = [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="flex justify-between">
        <h1 className="font-heading text-2xl font-bold">Evidence packs</h1>
        <Link href="/evidence-packs/new" className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          New pack
        </Link>
      </header>
      <ul className="space-y-2">
        {packs.map((p) => (
          <li key={p.id}>
            <Link href={`/evidence-packs/${p.id}`} className="block rounded-lg border p-3">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
