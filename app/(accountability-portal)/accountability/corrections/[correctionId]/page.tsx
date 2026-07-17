import Link from "next/link";
import { notFound } from "next/navigation";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { getPublishedCorrection } from "@/lib/accountability/public-reader";

export default async function CorrectionDetailPage({
  params,
}: {
  params: Promise<{ correctionId: string }>;
}) {
  const { correctionId } = await params;
  const correction = await getPublishedCorrection(correctionId);
  if (!correction) notFound();

  return (
    <article className="space-y-6">
      <p className="text-sm">
        <Link href="/accountability/corrections" className="text-primary hover:underline">
          Corrections
        </Link>
        <span className="text-muted-foreground"> / {correction.publicId}</span>
      </p>
      <DemonstrationBanner show={correction.isDemonstration} />
      <h1 className="font-heading text-3xl font-bold">{correction.title}</h1>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <dt className="text-xs font-medium uppercase text-muted-foreground">
            Original published value
          </dt>
          <dd className="mt-2 text-sm">{correction.originalValueSummary}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <dt className="text-xs font-medium uppercase text-muted-foreground">
            Corrected value
          </dt>
          <dd className="mt-2 text-sm">{correction.correctedValueSummary}</dd>
        </div>
      </dl>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-semibold">Reason</h2>
        <p className="text-sm whitespace-pre-wrap">{correction.reason}</p>
      </section>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Discovery date</dt>
          <dd>{new Date(correction.discoveryDate).toLocaleDateString("en-AU")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Correction date</dt>
          <dd>{new Date(correction.correctionDate).toLocaleDateString("en-AU")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Materiality</dt>
          <dd>{correction.materiality}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Approving authority</dt>
          <dd>{correction.approvingAuthority ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
