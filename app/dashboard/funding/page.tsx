import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function FundingPage() {
  const user = await requireAuth();
  const sources = await prisma.participantFundingSource.findMany({ where: { participantId: user.id } });
  return (
    <div className="space-y-6">
      <header className="flex justify-between"><h1 className="font-heading text-2xl font-bold">Funding sources</h1>
        <Link href="/dashboard/funding/new" className="min-h-11 inline-flex items-center rounded-lg bg-primary px-4 text-primary-foreground">Add funding source</Link>
      </header>
      <p className="text-sm text-muted-foreground">Funding tags help describe how services may be paid. This is not proof of available budget.</p>
      <ul>{sources.map(s => <li key={s.id} className="rounded-lg border p-3 mb-2"><Link href={`/dashboard/funding/${s.id}`}>{s.displayName}</Link> — {s.type} ({s.status})</li>)}</ul>
    </div>
  );
}
