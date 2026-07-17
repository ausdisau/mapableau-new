import Link from "next/link";

import {
  getSnapshotForReview,
  listSnapshotsForAdmin,
} from "@/lib/accountability/admin-reader";
import { requirePermission } from "@/lib/auth/guards";

export default async function AdminPublicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requirePermission("accountability:prepare_snapshot");
  const { id } = await searchParams;
  const snapshots = await listSnapshotsForAdmin(30);
  const review = id ? await getSnapshotForReview(id) : null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm">
          <Link href="/admin/accountability" className="text-primary hover:underline">
            Accountability
          </Link>
          <span className="text-muted-foreground"> / Publications</span>
        </p>
        <h1 className="font-heading text-2xl font-bold">Publication review</h1>
        <p className="text-sm text-muted-foreground">
          Side-by-side review of source package, privacy actions, methodology and
          previous approvals. Separation of duties is enforced server-side.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Snapshots</h2>
          <ul className="space-y-2">
            {snapshots.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/accountability/publications?id=${s.id}`}
                  className="block rounded border border-slate-200 p-3 text-sm hover:border-primary"
                >
                  {s.title} · {s.status}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Review panel</h2>
          {!review ? (
            <p className="text-sm text-muted-foreground">
              Select a snapshot to review transformed values, evidence and
              approval history.
            </p>
          ) : (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <h3 className="font-semibold">{review.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Status: {review.status} · Prepared by:{" "}
                  {review.preparedById ?? "unknown"} · SHA-256:{" "}
                  {review.contentSha256?.slice(0, 16) ?? "pending"}…
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Proposed public package</h4>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(review.packageJson, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium">Metric values</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {review.values.map((v) => (
                    <li key={v.id} className="rounded border p-2">
                      <p className="font-medium">{v.metric.name}</p>
                      <p className="text-xs text-muted-foreground">
                        value={v.value ?? "null"} · sample={v.sampleSize ?? "—"} ·{" "}
                        {v.suppressionReason ?? "no suppression"} · methodology{" "}
                        {v.metric.methodology.publicCode}
                      </p>
                      <p className="text-xs">{v.accessibleSummary}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium">Evidence</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  {review.evidence.map((e) => (
                    <li key={e.id}>
                      {e.publicCitationLabel} ({e.accessClassification})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium">Approvals</h4>
                <ol className="mt-2 space-y-1 text-sm">
                  {review.approvals.map((a) => (
                    <li key={a.id}>
                      {a.stage}: {a.decision} by {a.actorUserId}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
