import Link from "next/link";
import { Suspense } from "react";

import { CatalogueFilters } from "@/components/academy/CatalogueFilters";
import { HisTheoryBanner } from "@/components/academy/HisTheoryBanner";
import { listPublicCatalogue } from "@/lib/academy/catalogue/catalogue-service";
import { prisma } from "@/lib/prisma";
import type { AcademyCourseLevel } from "@prisma/client";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AcademyCataloguePage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = {
    q: one(sp.q),
    schoolCode: one(sp.school),
    level: one(sp.level) as AcademyCourseLevel | undefined,
    deliveryFormat: one(sp.format),
    clinicalReviewRequired:
      one(sp.clinical) === "yes" ? true : one(sp.clinical) === "no" ? false : undefined,
    practicalAssessmentRequired:
      one(sp.practical) === "yes"
        ? true
        : one(sp.practical) === "no"
          ? false
          : undefined,
  };

  const [catalogue, schools] = await Promise.all([
    listPublicCatalogue(filters),
    prisma.academySchool.findMany({
      where: { status: "active" },
      orderBy: { displayOrder: "asc" },
      select: { code: true, name: true },
    }),
  ]);

  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-teal-950">Course catalogue</h1>
        <p className="mt-2 text-slate-700">
          Published MapAble Academy courses only. Certificates of Completion are
          non-accredited professional development and do not guarantee NDIS compliance.
        </p>
      </header>

      <Suspense fallback={<p>Loading filters…</p>}>
        <CatalogueFilters schools={schools} />
      </Suspense>

      <p className="text-sm text-slate-600" aria-live="polite">
        Showing {catalogue.length} published course{catalogue.length === 1 ? "" : "s"}.
      </p>

      <ul className="space-y-4">
        {catalogue.map((course) => (
          <li key={course.id} className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-semibold text-teal-900">
              <Link
                href={`/academy/catalogue/${course.code}`}
                className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {course.title}
              </Link>
            </h2>
            <p className="text-sm text-slate-600">
              {course.code}
              {course.school ? ` · ${course.school.code}` : null}
              {course.level ? ` · ${course.level}` : null}
              {course.durationMinutes ? ` · ${course.durationMinutes} min` : null}
            </p>
            <HisTheoryBanner
              show={Boolean(
                course.practicalAssessmentRequired || course.school?.code === "HIS",
              )}
            />
            <p className="mt-1 text-slate-700">
              {course.indicativeLearningOutcome ?? course.summary}
            </p>
          </li>
        ))}
      </ul>

      {catalogue.length === 0 ? (
        <p className="text-slate-600">
          No published courses match these filters. Import leaves courses as{" "}
          <strong>PLANNED</strong> until governance publishes them. The demonstration
          Worker Foundations course remains at{" "}
          <Link href="/academy/courses/mapable-worker-foundations" className="text-teal-800 underline">
            /academy/courses/mapable-worker-foundations
          </Link>
          .
        </p>
      ) : null}

      <p className="text-sm">
        <Link href="/academy/pathways" className="text-teal-800 underline">
          Browse learning pathways
        </Link>
      </p>
    </article>
  );
}
