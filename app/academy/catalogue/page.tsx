import Link from "next/link";

import { listPublishedCatalogue } from "@/lib/academy/catalogue/catalogue-service";

export default async function AcademyCataloguePage() {
  const catalogue = await listPublishedCatalogue();

  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-teal-950">Course catalogue</h1>
        <p className="mt-2 text-slate-700">
          Searchable courses published by MapAble Academy. Demonstration content uses
          fictional examples only.
        </p>
      </header>
      <ul className="space-y-4">
        {catalogue.map((course) => {
          const version = course.versions[0];
          return (
            <li key={course.id} className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-semibold text-teal-900">
                <Link
                  href={`/academy/courses/${course.slug}`}
                  className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  {version?.title ?? course.title}
                </Link>
              </h2>
              <p className="text-sm text-slate-600">
                {course.code}
                {version ? ` · version ${version.versionNumber}` : null}
              </p>
              <p className="mt-1 text-slate-700">
                {version?.description ?? course.summary}
              </p>
            </li>
          );
        })}
      </ul>
      {catalogue.length === 0 ? (
        <p className="text-slate-600">No published courses yet. Seed the demonstration course to begin.</p>
      ) : null}
    </article>
  );
}
