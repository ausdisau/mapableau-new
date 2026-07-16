import Link from "next/link";

export default function AdminContinuityPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Admin · ContinuityOS</h1>
      <p className="mt-2 text-slate-700">
        Operational flags, playbooks and org metrics. Administrators must not receive
        unrestricted routine access to participant life-event or recovery content.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li>
          <Link href="/admin/continuity-intelligence" className="underline">
            Continuity intelligence (existing)
          </Link>
        </li>
        <li>
          <Link href="/admin/institutional-continuity" className="underline">
            Institutional continuity (existing)
          </Link>
        </li>
        <li>
          <Link href="/organisation/continuity" className="underline">
            Organisation continuity
          </Link>
        </li>
      </ul>
    </main>
  );
}
