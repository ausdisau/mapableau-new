import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listPublishedCourses } from "@/lib/academy/course-service";
import { listUserEnrolments } from "@/lib/academy/enrolment-service";

export const metadata = {
  title: "MapAble Academy | DisAcademy",
  description: "Accessible training for workers, providers and the community",
};

export default async function AcademyCatalogPage() {
  const user = await requirePermission("academy:read");
  const [courses, enrolments] = await Promise.all([
    listPublishedCourses(),
    listUserEnrolments(user.id),
  ]);

  const enrolledIds = new Set(enrolments.map((e) => e.courseId));

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">MapAble Academy</h1>
        <p className="text-muted-foreground max-w-2xl">
          Accessible courses for disability awareness, worker onboarding and NDIS
          compliance. Complete lessons, pass the quiz, and earn a certificate.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/dashboard/academy"
            className="text-sm font-medium text-primary underline"
          >
            My learning
          </Link>
          <Link
            href="/academy/provider"
            className="text-sm text-muted-foreground underline"
          >
            Provider academy (legacy)
          </Link>
        </div>
      </header>

      <section aria-label="Course catalog">
        <h2 className="font-medium text-lg">Courses</h2>
        {courses.length === 0 ? (
          <p role="status" className="mt-4 text-muted-foreground">
            New courses are being published. Check back soon.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/academy/courses/${c.id}`}
                  className="block h-full rounded-xl border border-border bg-card p-5 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {c.category.replace(/_/g, " ")}
                  </span>
                  <h3 className="mt-1 font-heading text-lg font-bold">
                    {c.title}
                  </h3>
                  {c.summary ? (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {c.summary}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {c._count.lessons} lessons · ~{c.estimatedMinutes} min
                    {enrolledIds.has(c.id) ? " · Enrolled" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
