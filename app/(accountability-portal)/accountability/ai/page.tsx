import Link from "next/link";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { listPublishedAiSystems } from "@/lib/accountability/public-reader";

export default async function AccountabilityAiPage() {
  const systems = await listPublishedAiSystems();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">AI and algorithmic accountability</h1>
        <p className="max-w-2xl text-muted-foreground">
          Public AI systems register with limitations, human review and challenge
          pathways. Raw prompts and private model inputs are never published.
        </p>
      </header>
      <ExplainThisPage summary="Each AI system card explains purpose, decision role, data categories at a high level, human review requirements, and how to challenge consequential recommendations." />
      <p className="text-sm">
        Related civic register:{" "}
        <Link href="/algorithms" className="text-primary hover:underline">
          Public algorithm register
        </Link>
      </p>
      {systems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No AI systems published yet.</p>
      ) : (
        <ul className="space-y-4">
          {systems.map((system) => (
            <li key={system.publicCode} className="rounded-xl border border-slate-200 bg-white p-5">
              <DemonstrationBanner show={system.isDemonstration} />
              <h2 className="mt-2 font-heading text-lg font-semibold">
                <Link
                  href={`/accountability/ai/${system.publicCode}`}
                  className="text-primary hover:underline"
                >
                  {system.name}
                </Link>
              </h2>
              <p className="mt-1 text-sm">{system.purpose}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {system.decisionRole} · Human review:{" "}
                {system.humanReviewRequired ? "required" : "not required"} ·{" "}
                {system.retirementStatus}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
