import Link from "next/link";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { listPublishedCorrections } from "@/lib/accountability/public-reader";

export default async function AccountabilityCorrectionsPage() {
  const corrections = await listPublishedCorrections();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Corrections</h1>
        <p className="max-w-2xl text-muted-foreground">
          Corrections never silently overwrite previously published information.
          Original values remain visible with reasons and approval records.
        </p>
      </header>
      <ExplainThisPage summary="When a published figure is wrong or misleading, MapAble records the original value, the corrected value, why it changed, and who approved the correction." />
      {corrections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No public corrections published.</p>
      ) : (
        <ul className="space-y-4">
          {corrections.map((c) => (
            <li key={c.publicId} className="rounded-xl border border-slate-200 bg-white p-5">
              <DemonstrationBanner show={c.isDemonstration} />
              <h2 className="mt-2 font-heading text-lg font-semibold">
                <Link
                  href={`/accountability/corrections/${c.publicId}`}
                  className="text-primary hover:underline"
                >
                  {c.title}
                </Link>
              </h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Original</dt>
                  <dd>{c.originalValueSummary}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Corrected</dt>
                  <dd>{c.correctedValueSummary}</dd>
                </div>
              </dl>
              <p className="mt-2 text-sm">{c.reason}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Corrected {new Date(c.correctionDate).toLocaleDateString("en-AU")} ·{" "}
                {c.materiality}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm">
        Think something is wrong?{" "}
        <Link href="/accountability/submit" className="font-medium text-primary hover:underline">
          Submit a challenge
        </Link>
        .
      </p>
    </div>
  );
}
