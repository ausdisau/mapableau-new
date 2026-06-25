import Link from "next/link";

import { AccessVerificationActions } from "@/components/access/AccessVerificationActions";
import { ACCESS_LABELS } from "@/lib/access-map/copy";

export function CommunityReportsFeed({
  placeId,
  reports,
}: {
  placeId: string;
  reports: {
    id: string;
    displayName: string;
    reviewBody: string;
    reportType: string;
    createdAt: string;
    verifications?: Record<string, number>;
  }[];
}) {
  if (!reports.length) {
    return (
      <section aria-labelledby="reports-feed-heading">
        <h2 id="reports-feed-heading" className="text-lg font-semibold">
          Community reports
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No community reports yet.{" "}
          <Link href={`/access/places/${placeId}/report/new`} className="underline">
            Add the first report
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="reports-feed-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id="reports-feed-heading" className="text-lg font-semibold">
          Community reports
        </h2>
        <Link
          href={`/access/places/${placeId}/reports`}
          className="text-sm underline"
        >
          View all
        </Link>
      </div>
      <ul className="space-y-4">
        {reports.map((report) => (
          <li key={report.id} className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium">{report.displayName}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {report.reportType.replace(/_/g, " ")} ·{" "}
              {new Date(report.createdAt).toLocaleDateString("en-AU")}
            </p>
            <p className="mt-2 text-sm">{report.reviewBody}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {ACCESS_LABELS.userReported}
            </p>
            {report.verifications?.confirm ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Confirmed by {report.verifications.confirm} community member
                {report.verifications.confirm === 1 ? "" : "s"}
              </p>
            ) : null}
            <div className="mt-3">
              <AccessVerificationActions
                entityType="AccessPlaceReview"
                entityId={report.id}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
