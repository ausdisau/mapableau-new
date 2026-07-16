import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listStudioCourses } from "@/lib/academy/studio/studio-service";

export default async function StudioCoursesPage() {
  const user = await requirePermission("academy:studio:author");
  const courses = await listStudioCourses(user);

  return (
    <article className="space-y-6">
      <h1 className="font-heading text-3xl font-bold text-teal-950">Studio courses</h1>
      <ul className="space-y-3">
        {courses.map((c) => (
          <li key={c.id} className="border-b pb-3">
            <Link
              href={`/academy/studio/courses/${c.id}`}
              className="text-lg font-medium text-teal-900 underline"
            >
              {c.title}
            </Link>
            <p className="text-sm text-slate-600">
              {c.code} · versions:{" "}
              {c.versions.map((v) => `${v.versionNumber}/${v.status}`).join(", ")}
            </p>
          </li>
        ))}
      </ul>
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/academy/studio/reviews" className="text-teal-800 underline">
          Reviews
        </Link>
        <Link href="/academy/studio/frameworks" className="text-teal-800 underline">
          Frameworks
        </Link>
        <Link href="/academy/studio/assessments" className="text-teal-800 underline">
          Assessments
        </Link>
        <Link href="/academy/studio/credentials" className="text-teal-800 underline">
          Credentials
        </Link>
        <Link href="/academy/studio/audit" className="text-teal-800 underline">
          Audit
        </Link>
      </nav>
    </article>
  );
}
