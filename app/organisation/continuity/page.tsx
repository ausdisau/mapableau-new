import Link from "next/link";

export default function OrganisationContinuityPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Organisation continuity</h1>
      <p className="mt-2 text-slate-700">
        Provider and organisation continuity operations. This surface does not grant
        unrestricted access to participant life-event content.
      </p>
      <p className="mt-4 text-sm">
        API: <code>/api/organisation/continuity</code>
      </p>
      <p className="mt-4 text-sm">
        <Link href="/admin/continuity" className="underline">
          Admin ContinuityOS
        </Link>
      </p>
    </main>
  );
}
