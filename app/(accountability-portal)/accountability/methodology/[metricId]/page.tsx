import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedMethodology } from "@/lib/accountability/public-reader";

export default async function MethodologyDetailPage({
  params,
}: {
  params: Promise<{ metricId: string }>;
}) {
  const { metricId } = await params;
  const methodology = await getPublishedMethodology(metricId);
  if (!methodology) notFound();

  return (
    <article className="space-y-6">
      <p className="text-sm">
        <Link href="/accountability/methodology" className="text-primary hover:underline">
          Methodology
        </Link>
        <span className="text-muted-foreground"> / {methodology.publicCode}</span>
      </p>
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">{methodology.title}</h1>
        <p className="text-sm text-muted-foreground">
          Version {methodology.version} · Owner role: {methodology.ownerRole}
        </p>
      </header>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-semibold">Plain-language summary</h2>
        <p className="whitespace-pre-wrap text-sm">{methodology.plainLanguage}</p>
      </section>
      {methodology.technicalNotes ? (
        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">Technical notes</h2>
          <p className="whitespace-pre-wrap text-sm">{methodology.technicalNotes}</p>
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Related metrics</h2>
        <ul className="space-y-3">
          {methodology.metrics.map((metric) => (
            <li key={metric.publicCode} className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold">{metric.name}</h3>
              <p className="mt-1 text-sm">{metric.description}</p>
              <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="font-medium">Domain</dt>
                  <dd>{metric.domain}</dd>
                </div>
                <div>
                  <dt className="font-medium">Unit</dt>
                  <dd>{metric.unit}</dd>
                </div>
                <div>
                  <dt className="font-medium">Minimum cohort size</dt>
                  <dd>{metric.minimumCohortSize}</dd>
                </div>
                <div>
                  <dt className="font-medium">Update frequency</dt>
                  <dd>{metric.updateFrequency}</dd>
                </div>
                {metric.numeratorDefinition ? (
                  <div className="sm:col-span-2">
                    <dt className="font-medium">Numerator</dt>
                    <dd>{metric.numeratorDefinition}</dd>
                  </div>
                ) : null}
                {metric.denominatorDefinition ? (
                  <div className="sm:col-span-2">
                    <dt className="font-medium">Denominator</dt>
                    <dd>{metric.denominatorDefinition}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
