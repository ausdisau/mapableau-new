import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listLearnerEnrolments } from "@/lib/academy/learning/learning-service";

export default async function AcademyLearnDashboardPage() {
  const user = await requirePermission("academy:learn");
  const enrolments = await listLearnerEnrolments(user.id);

  return (
    <article className="space-y-6">
      <h1 className="font-heading text-3xl font-bold text-teal-950">Your learning</h1>
      <p className="text-slate-700">Welcome, {user.name}. Resume any enrolment below.</p>
      <ul className="space-y-3">
        {enrolments.map((e) => (
          <li key={e.id} className="border-b border-slate-200 pb-3">
            <Link
              href={`/academy/learn/${e.id}`}
              className="text-lg font-medium text-teal-900 underline-offset-4 hover:underline"
            >
              {e.courseVersion.title}
            </Link>
            <p className="text-sm text-slate-600">
              Status: {e.status}
              {e.completedAt
                ? ` · completed ${e.completedAt.toISOString().slice(0, 10)}`
                : null}
            </p>
          </li>
        ))}
      </ul>
      {enrolments.length === 0 ? (
        <p>
          No enrolments yet.{" "}
          <Link href="/academy/catalogue" className="text-teal-800 underline">
            Browse the catalogue
          </Link>
          .
        </p>
      ) : null}
      <p className="text-sm">
        <Link href="/academy/credentials" className="text-teal-800 underline">
          Certificates
        </Link>
        {" · "}
        <Link href="/academy/record" className="text-teal-800 underline">
          Learning record
        </Link>
      </p>
    </article>
  );
}
