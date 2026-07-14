import Link from "next/link";
import { notFound } from "next/navigation";

import { HisTheoryBanner } from "@/components/academy/HisTheoryBanner";
import { getPublicCourseByCode } from "@/lib/academy/catalogue/catalogue-service";
import { STANDARD_CREDENTIAL_TYPE } from "@/lib/academy/config";

type Props = { params: Promise<{ courseCode: string }> };

export default async function CatalogueCoursePage({ params }: Props) {
  const { courseCode } = await params;
  const course = await getPublicCourseByCode(decodeURIComponent(courseCode));
  if (!course) notFound();

  const isHis =
    course.practicalAssessmentRequired || course.school?.code === "HIS";

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/academy/catalogue" className="text-teal-800 underline">
          Catalogue
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{course.code}</span>
      </nav>
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-teal-950">{course.title}</h1>
        <p className="text-sm text-slate-600">
          {course.code}
          {course.school ? ` · ${course.school.name}` : null}
          {course.level ? ` · ${course.level}` : null}
          {course.durationMinutes ? ` · ${course.durationMinutes} minutes` : null}
        </p>
      </header>
      <HisTheoryBanner show={Boolean(isHis)} />
      <p className="text-slate-700">{course.indicativeLearningOutcome ?? course.summary}</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-600">Primary audience</dt>
          <dd>{course.primaryAudience ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Delivery</dt>
          <dd>{course.deliveryFormat ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Assessment</dt>
          <dd>{course.assessmentType ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Credential</dt>
          <dd>{course.credentialType ?? STANDARD_CREDENTIAL_TYPE}</dd>
        </div>
      </dl>
      {course.frameworkTags.length > 0 ? (
        <section aria-labelledby="tags-heading">
          <h2 id="tags-heading" className="text-lg font-semibold">
            Framework tags
          </h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {course.frameworkTags.map((t) => (
              <li key={t.frameworkTag.code}>{t.frameworkTag.label}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {course.sources.length > 0 ? (
        <section aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="text-lg font-semibold">
            Authoritative sources
          </h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {course.sources.map((s) => (
              <li key={s.sourceUrl}>
                <a
                  href={s.sourceUrl}
                  className="text-teal-800 underline"
                  rel="noopener noreferrer"
                >
                  {s.sourceTitle ?? s.sourceUrl}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
