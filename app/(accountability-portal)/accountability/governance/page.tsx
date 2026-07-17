import Link from "next/link";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { listPublishedGovernanceDecisions } from "@/lib/accountability/public-reader";

export default async function AccountabilityGovernancePage() {
  const decisions = await listPublishedGovernanceDecisions();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Governance transparency</h1>
        <p className="max-w-2xl text-muted-foreground">
          Public governance decisions and accountability assignments. Private
          minutes stay internal; only authorised summaries appear here.
        </p>
      </header>
      <ExplainThisPage summary="Decision records summarise the question considered, options, rights and accessibility implications, and who implements the outcome." />
      <p className="text-sm">
        Related pages:{" "}
        <Link href="/governance" className="text-primary hover:underline">
          Governance charter
        </Link>
        {" · "}
        <Link href="/decisions" className="text-primary hover:underline">
          Decision register
        </Link>
      </p>
      {decisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No governance decisions published yet.</p>
      ) : (
        <ul className="space-y-4">
          {decisions.map((d) => (
            <li key={d.publicId} className="rounded-xl border border-slate-200 bg-white p-5">
              <DemonstrationBanner show={d.isDemonstration} />
              <h2 className="mt-2 font-heading text-lg font-semibold">
                <Link
                  href={`/accountability/decisions/${d.publicId}`}
                  className="text-primary hover:underline"
                >
                  {d.questionConsidered}
                </Link>
              </h2>
              <p className="mt-1 text-sm">{d.decisionSummary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {d.decisionBody} ·{" "}
                {new Date(d.decisionDate).toLocaleDateString("en-AU")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
