import Link from "next/link";
import { notFound } from "next/navigation";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { prisma } from "@/lib/prisma";

export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = await params;
  const dataset = await prisma.accountabilityOpenDataset.findFirst({
    where: { publicId: datasetId, status: "published" },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });
  if (!dataset) notFound();

  return (
    <article className="space-y-6">
      <p className="text-sm">
        <Link href="/accountability/open-data" className="text-primary hover:underline">
          Open data
        </Link>
        <span className="text-muted-foreground"> / {dataset.publicId}</span>
      </p>
      <DemonstrationBanner show={dataset.isDemonstration} />
      <h1 className="font-heading text-3xl font-bold">{dataset.title}</h1>
      <p className="text-muted-foreground">{dataset.description}</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Publisher</dt>
          <dd>{dataset.publisher}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Licence</dt>
          <dd>{dataset.licence}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Geography</dt>
          <dd>{dataset.geography ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Update frequency</dt>
          <dd>{dataset.updateFrequency ?? "—"}</dd>
        </div>
      </dl>
      {dataset.knownLimitations ? (
        <section>
          <h2 className="font-heading text-lg font-semibold">Known limitations</h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">{dataset.knownLimitations}</p>
        </section>
      ) : null}
      <section>
        <h2 className="font-heading text-lg font-semibold">Versions</h2>
        <ul className="mt-3 space-y-2">
          {dataset.versions.map((v) => (
            <li key={v.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium">Version {v.version}</p>
              <p className="text-xs text-muted-foreground">
                Records: {v.recordCount}
                {v.checksum ? ` · SHA-256 ${v.checksum.slice(0, 16)}…` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
