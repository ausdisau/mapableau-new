import Link from "next/link";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { listPublishedCommitments } from "@/lib/accountability/public-reader";

export default async function CommitmentsPage() {
  const commitments = await listPublishedCommitments();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Public commitments</h1>
        <p className="max-w-2xl text-muted-foreground">
          Commitments stay visible when delayed or withdrawn. Missed targets are
          not hidden when a new reporting period begins.
        </p>
      </header>
      <ExplainThisPage summary="Each commitment shows who is accountable, the target date, current status, and reasons for delay or withdrawal." />
      {commitments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No commitments published yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">Public commitments register</caption>
            <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Commitment</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Accountable body</th>
                <th scope="col" className="px-4 py-3">Target</th>
              </tr>
            </thead>
            <tbody>
              {commitments.map((c) => (
                <tr key={c.slug} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <DemonstrationBanner show={c.isDemonstration} />
                    <Link
                      href={`/accountability/commitments/${c.slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{c.plainLanguage}</p>
                  </td>
                  <td className="px-4 py-3">{c.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">{c.accountableBody}</td>
                  <td className="px-4 py-3">
                    {c.targetDate
                      ? new Date(c.targetDate).toLocaleDateString("en-AU")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
