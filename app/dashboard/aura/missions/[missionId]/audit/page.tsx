import Link from "next/link";

export default async function AuraMissionAuditPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">AURA mission audit</h1>
      <p className="mt-2 text-sm text-slate-700">
        Structured replay for mission <code>{missionId}</code>. Shows evidence,
        deterministic decisions, counterfactuals, and Stop events. Does not
        expose hidden chain-of-thought.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li>
          <a
            className="underline"
            href={`/api/intelligence/aura/missions/${missionId}/audit?mode=manifest`}
          >
            Download JSON manifest
          </a>
        </li>
        <li>
          <a
            className="underline"
            href={`/api/intelligence/aura/missions/${missionId}/audit/verify`}
          >
            Verify hash chain
          </a>
        </li>
        <li>
          <Link className="underline" href="/ask?mode=aura">
            Back to Accessibility Mission
          </Link>
        </li>
        <li>
          <Link className="underline" href="/access">
            Standard access map (non-AI)
          </Link>
        </li>
      </ul>
    </main>
  );
}
