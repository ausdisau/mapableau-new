import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PlatformTenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  await requirePermission("platform:tenants:read");
  const { tenantId } = await params;
  const org = await prisma.organisation.findUnique({
    where: { id: tenantId },
    include: {
      tenantStatusTransitions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      tenantFeatureEntitlements: true,
      tenantOnboardingCases: true,
      generalAvailabilityAssessments: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!org) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{org.name}</h1>
        <p className="text-sm">
          Tenant status <strong>{org.tenantStatus}</strong> is operational
          metadata. It is not a certification or GA approval.
        </p>
      </header>

      <section>
        <h2 className="font-semibold">Lifecycle</h2>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <dt>Type</dt>
          <dd>{org.tenantType}</dd>
          <dt>Operating model</dt>
          <dd>{org.operatingModel}</dd>
          <dt>Data isolation</dt>
          <dd>{org.dataIsolationMode}</dd>
          <dt>Data region</dt>
          <dd>{org.dataRegion}</dd>
          <dt>Onboarding started</dt>
          <dd>{org.onboardingStartedAt?.toISOString() ?? "—"}</dd>
          <dt>Activated</dt>
          <dd>{org.activatedAt?.toISOString() ?? "—"}</dd>
        </dl>
      </section>

      <section>
        <h2 className="font-semibold">Recent status transitions</h2>
        {org.tenantStatusTransitions.length === 0 ? (
          <p className="text-sm">No transitions yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {org.tenantStatusTransitions.map((t) => (
              <li key={t.id}>
                {t.fromStatus} → {t.toStatus} · {t.createdAt.toISOString()} ·{" "}
                {t.reason}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Active entitlements</h2>
        {org.tenantFeatureEntitlements.length === 0 ? (
          <p className="text-sm">No entitlements. Env flags alone do not enable features.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {org.tenantFeatureEntitlements.map((e) => (
              <li key={e.id}>
                {e.featureKey} · {e.environment} · {e.status}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">GA assessments (advisory only)</h2>
        {org.generalAvailabilityAssessments.length === 0 ? (
          <p className="text-sm">No GA assessments. AI cannot approve GA.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {org.generalAvailabilityAssessments.map((g) => (
              <li key={g.id}>
                {g.decision} · advisoryOnly={String(g.advisoryOnly)} ·{" "}
                {g.createdAt.toISOString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
