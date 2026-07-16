import Link from "next/link";

export default function RecoveryIncidentsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Recovery and incidents</h1>
      <p className="mt-2 text-slate-700">
        ContinuityOS may link to canonical incident and complaint records. It does
        not replace the Safety Centre and cannot close incidents or safeguarding
        concerns.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li>
          <Link className="underline" href="/dashboard/safety/incidents">
            Open Safety Centre incidents
          </Link>
        </li>
        <li>
          <Link className="underline" href="/recovery">
            Back to recovery
          </Link>
        </li>
      </ul>
    </main>
  );
}
