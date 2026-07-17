import Link from "next/link";
import { notFound } from "next/navigation";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { verifySnapshotByPublicId } from "@/lib/accountability/public-reader";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = await verifySnapshotByPublicId(reportId);
  if (!report) notFound();

  return (
    <article className="space-y-6">
      <p className="text-sm">
        <Link href="/accountability/reports" className="text-primary hover:underline">
          Reports
        </Link>
        <span className="text-muted-foreground"> / {report.publicId}</span>
      </p>
      <DemonstrationBanner show={report.isDemonstration} />
      <h1 className="font-heading text-3xl font-bold">{report.title}</h1>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd>{report.status}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Published</dt>
          <dd>
            {report.publishedAt
              ? new Date(report.publishedAt).toLocaleDateString("en-AU")
              : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Content checksum (SHA-256)</dt>
          <dd className="mt-1 break-all font-mono text-xs">{report.contentSha256}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Checksum verification</dt>
          <dd>{report.checksumValid ? "Valid" : "Failed"}</dd>
        </div>
      </dl>
      <p className="text-sm">
        Machine-readable verification:{" "}
        <Link
          href={`/api/public/accountability/v1/verify/${report.publicId}`}
          className="text-primary hover:underline"
        >
          /api/public/accountability/v1/verify/{report.publicId}
        </Link>
      </p>
    </article>
  );
}
