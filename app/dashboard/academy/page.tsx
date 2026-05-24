import Link from "next/link";

import { CertificateBadge } from "@/components/academy/CertificateBadge";
import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requirePermission } from "@/lib/auth/guards";
import { listUserEnrolments } from "@/lib/academy/enrolment-service";
import { listUserCertificates } from "@/lib/academy/quiz-service";

export const metadata = { title: "My learning | MapAble Academy" };

export default async function DashboardAcademyPage() {
  const user = await requirePermission("academy:read");
  const [enrolments, certificates] = await Promise.all([
    listUserEnrolments(user.id),
    listUserCertificates(user.id),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">My learning</h1>
          <p className="text-muted-foreground">
            Courses you are taking on MapAble Academy.
          </p>
        </div>
        <Link
          href="/academy"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground"
        >
          Browse courses
        </Link>
      </header>

      {certificates.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-medium">Certificates</h2>
          {certificates.map((c) => (
            <CertificateBadge
              key={c.id}
              certificateNumber={c.certificateNumber}
              courseTitle={c.enrolment.course.title}
              issuedAt={c.issuedAt}
            />
          ))}
        </section>
      ) : null}

      <section>
        <h2 className="font-medium">Enrolments</h2>
        {enrolments.length === 0 ? (
          <p role="status" className="mt-2 text-muted-foreground">
            You have not enrolled in any courses yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {enrolments.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/academy/courses/${e.courseId}/learn`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <span className="font-medium">{e.course.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {e.progressPercent}%
                    </span>
                    <StatusTextBadge status={e.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
