import Link from "next/link";

import {
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { requirePermission } from "@/lib/auth/guards";
import { getAcademyCatalog, listUserEnrollments } from "@/lib/provider-academy/academy-service";

export default async function AcademyPage() {
  const user = await requirePermission("provider_academy:enroll");
  const [catalog, enrollments] = await Promise.all([
    getAcademyCatalog(),
    listUserEnrollments(user.id),
  ]);

  return (
    <CorePageContainer variant="narrow">
      <CorePageHeader
        eyebrow="Provider"
        title="Provider academy"
        description="Training courses and your enrollments."
      >
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Back to control panel
        </Link>
      </CorePageHeader>
      <section aria-labelledby="academy-enrollments-heading" className="space-y-4">
        <h2 id="academy-enrollments-heading" className="font-heading text-lg font-semibold">
          Your enrollments
        </h2>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">You are not enrolled in any courses yet.</p>
        ) : (
          <ul className="space-y-4">
            {enrollments.map((e) => (
              <li key={e.id}>
                <CoreRecordCard title={e.course.title} meta={e.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="academy-catalog-heading" className="space-y-4">
        <h2 id="academy-catalog-heading" className="font-heading text-lg font-semibold">
          Catalog
        </h2>
        {catalog.length === 0 ? (
          <CoreEmptyState
            title="No courses available"
            description="The academy catalog is empty in this environment."
          />
        ) : (
          <ul className="space-y-4">
            {catalog.map((c) => (
              <li key={c.id}>
                <CoreRecordCard title={c.title}>
                  <p className="text-muted-foreground">{c.description}</p>
                </CoreRecordCard>
              </li>
            ))}
          </ul>
        )}
      </section>
    </CorePageContainer>
  );
}
