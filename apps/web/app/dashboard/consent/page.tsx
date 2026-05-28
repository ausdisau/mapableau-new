import Link from "next/link";

import { ConsentScopeCard } from "@/components/consent/ConsentScopeCard";
import { requireAuth } from "@/lib/auth/guards";
import { consentScopeFromPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Consent | MapAble Core" };

export default async function ConsentPage() {
  const user = await requireAuth();
  const consents = await prisma.consentRecord.findMany({
    where: { subjectUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: { grantedToOrganisation: true },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Your consent</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            You choose what is shared, with whom, and for what purpose. Revoked
            consent stops new access immediately.
          </p>
        </div>
        <Link
          href="/dashboard/consent/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Grant new consent
        </Link>
      </header>

      <div className="space-y-4">
        {consents.length === 0 ? (
          <p>No consent records yet.</p>
        ) : (
          consents.map((c) => (
            <div key={c.id}>
              <ConsentScopeCard
                scope={consentScopeFromPrisma(c.scope)}
                purpose={c.purpose}
                status={c.status}
                grantedToName={c.grantedToOrganisation?.name}
              />
              <Link
                href={`/dashboard/consent/${c.id}`}
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                View details
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
