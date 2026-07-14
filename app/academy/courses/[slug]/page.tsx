import Link from "next/link";
import { notFound } from "next/navigation";

import { EnrolButton } from "@/components/academy/EnrolButton";
import { getPublishedCourseBySlug } from "@/lib/academy/catalogue/catalogue-service";
import { COMPLETION_CERTIFICATE_LABEL } from "@/lib/academy/config";

type Props = { params: Promise<{ slug: string }> };

export default async function AcademyCoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  if (!course) notFound();
  const version = course.versions[0];
  if (!version) notFound();

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/academy/catalogue" className="text-teal-800 underline">
          Catalogue
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{course.title}</span>
      </nav>
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-teal-950">{version.title}</h1>
        <p className="text-slate-700">{version.description}</p>
        <p className="text-sm text-slate-600">
          {course.code} · course version {version.versionNumber} · awards a{" "}
          {COMPLETION_CERTIFICATE_LABEL}
        </p>
      </header>
      <EnrolButton courseSlug={course.slug} />
      <section aria-labelledby="outline-heading" className="space-y-3">
        <h2 id="outline-heading" className="text-xl font-semibold">
          Course outline
        </h2>
        {version.modules.map((mod) => (
          <div key={mod.id}>
            <h3 className="font-medium text-teal-900">{mod.title}</h3>
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
              {mod.lessons.map((lesson) => (
                <li key={lesson.id}>
                  {lesson.title}
                  {lesson.estimatedMinutes
                    ? ` (~${lesson.estimatedMinutes} min)`
                    : null}
                  {lesson.easyReadMarkdown ? " · Easy Read available" : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      {course.practiceStandardMappings.length > 0 ? (
        <section aria-labelledby="standards-heading" className="space-y-2">
          <h2 id="standards-heading" className="text-xl font-semibold">
            Practice standard references
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {course.practiceStandardMappings.map((m) => (
              <li key={m.id}>
                <strong>{m.standardTitle}</strong>
                {m.notes ? ` — ${m.notes}` : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
