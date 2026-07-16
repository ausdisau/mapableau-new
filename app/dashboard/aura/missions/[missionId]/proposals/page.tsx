import Link from "next/link";

export default async function AuraMissionProposalsPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">AURA proposals</h1>
      <p className="mt-2 text-sm text-slate-700">
        Mission <code>{missionId}</code>. Shadow mode only — no external
        actions. Use Accessibility Mission mode on{" "}
        <Link className="underline" href="/ask?mode=aura">
          /ask
        </Link>{" "}
        to create and review proposals.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li>
          <a
            className="underline"
            href={`/api/intelligence/aura/missions/${missionId}/proposals`}
          >
            List proposals (JSON)
          </a>
        </li>
        <li>
          <Link
            className="underline"
            href={`/dashboard/aura/missions/${missionId}/audit`}
          >
            Audit replay
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
