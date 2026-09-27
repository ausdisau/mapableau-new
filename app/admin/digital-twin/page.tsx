import Link from "next/link";

import { getAdminSnapshot } from "@/lib/digital-twin/digital-twin-service";

/**
 * Admin Digital Twin dashboard MVP.
 * Protected by app/admin/layout.tsx (requireAdminOpsAccess).
 * Not linked from public marketing navigation.
 */
export default function AdminDigitalTwinPage() {
  const snapshot = getAdminSnapshot();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Digital Twin admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Internal dashboard for demo Digital Twin data. TODO: connect to production persistence and
          moderation queue.
        </p>
      </header>

      <section aria-labelledby="cards-heading" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 id="cards-heading" className="sr-only">
          Summary metrics
        </h2>
        {[
          ["Total places", snapshot.totalPlaces],
          ["Published", snapshot.publishedPlaces],
          ["Under review", snapshot.placesUnderReview],
          ["Pending evidence", snapshot.pendingEvidence],
          ["Open issues", snapshot.openIssues],
          ["Avg confidence", `${snapshot.averageConfidence}%`],
          ["Avg accessibility", `${snapshot.averageAccessibilityScore}%`],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <AdminTable
        title="Places needing review"
        caption="Places with under_review status or confidence below 70%"
        headers={["Name", "Status", "Confidence", "Action"]}
        rows={snapshot.placesNeedingReview.map((p) => [
          p.name,
          p.status,
          `${p.confidenceScore}%`,
          "Review place (placeholder)",
        ])}
      />

      <AdminTable
        title="Open high-severity issues"
        caption="Issues marked high or urgent that are not resolved"
        headers={["Summary", "Severity", "Status", "Action"]}
        rows={snapshot.openHighSeverityIssues.map((i) => [
          i.summary,
          i.severity,
          i.status,
          "Review issue (placeholder)",
        ])}
      />

      <AdminTable
        title="Low-confidence places"
        caption="Places with confidence score below 75%"
        headers={["Name", "Confidence", "Action"]}
        rows={snapshot.lowConfidencePlaces.map((p) => [
          p.name,
          `${p.confidenceScore}%`,
          "Recalculate score (placeholder)",
        ])}
      />

      <AdminTable
        title="Upcoming reassessments"
        caption="Assessments due within 90 days"
        headers={["Place ID", "Due", "Action"]}
        rows={snapshot.upcomingReassessments.map((a) => [
          a.placeId,
          a.nextReviewDue
            ? new Date(a.nextReviewDue).toLocaleDateString("en-AU")
            : "—",
          "Schedule assessment (placeholder)",
        ])}
      />

      <p className="text-sm">
        <Link href="/digital-twin" className="text-[#005B7F] hover:underline">
          View public explorer
        </Link>
      </p>
    </div>
  );
}

function AdminTable({
  title,
  caption,
  headers,
  rows,
}: {
  title: string;
  caption: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <section aria-labelledby={`table-${title}`}>
      <h2 id={`table-${title}`} className="text-lg font-semibold">
        {title}
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-left">
              {headers.map((h) => (
                <th key={h} scope="col" className="p-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="p-4 text-muted-foreground">
                  None in demo dataset
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  {row.map((cell, j) => (
                    <td key={j} className="p-2">
                      {j === row.length - 1 ? (
                        <button
                          type="button"
                          aria-label={`${cell} for row ${i + 1}`}
                          className="min-h-11 rounded-lg border border-border px-3 text-xs font-medium"
                        >
                          {cell}
                        </button>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
