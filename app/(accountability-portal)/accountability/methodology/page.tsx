import Link from "next/link";

import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { listPublishedMethodologies } from "@/lib/accountability/public-reader";

export default async function AccountabilityMethodologyPage() {
  const methodologies = await listPublishedMethodologies();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Methodology</h1>
        <p className="max-w-2xl text-muted-foreground">
          Plain-language and technical statements behind every published
          accountability metric.
        </p>
      </header>
      <ExplainThisPage summary="Each methodology explains how a metric is defined, what is counted in the numerator and denominator, privacy rules, and who owns the definition." />
      {methodologies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No methodologies published yet.</p>
      ) : (
        <ul className="space-y-4">
          {methodologies.map((m) => (
            <li key={m.publicCode} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-heading text-lg font-semibold">
                <Link
                  href={`/accountability/methodology/${m.publicCode}`}
                  className="text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {m.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm">{m.plainLanguage}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Version {m.version} · Owner role: {m.ownerRole}
              </p>
              {m.metrics.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Metrics: {m.metrics.map((x) => x.name).join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
