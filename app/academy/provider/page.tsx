import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import {
  getAcademyCatalog,
  listUserEnrollments,
} from "@/lib/provider-academy/academy-service";

export const metadata = { title: "Provider academy | MapAble" };

export default async function ProviderAcademyLegacyPage() {
  const user = await requirePermission("provider_academy:enroll");
  const [catalog, enrollments] = await Promise.all([
    getAcademyCatalog(),
    listUserEnrollments(user.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/academy" className="text-sm text-primary underline">
        ← MapAble Academy
      </Link>
      <h1 className="font-heading text-2xl font-bold">Provider academy</h1>
      <p className="text-sm text-muted-foreground">
        Short compliance modules for provider organisations (legacy catalog).
      </p>
      <section>
        <h2 className="font-medium">Your enrollments</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {enrollments.map((e) => (
            <li key={e.id}>
              {e.course.title} — {e.status}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-medium">Catalog</h2>
        <ul className="mt-2 space-y-2">
          {catalog.map((c) => (
            <li key={c.id} className="rounded border p-3">
              <strong>{c.title}</strong>
              <p className="text-sm text-muted-foreground">{c.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
