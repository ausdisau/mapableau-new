import Link from "next/link";

export const metadata = {
  title: "Life events | MapAble ContinuityOS",
};

export default function LifeEventsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Life events</h1>
      <p className="mt-2 text-slate-700">
        Participant-controlled planning for planned life changes. ContinuityOS
        coordinates dependencies across MapAble services — it does not replace CareOS
        missions, incidents or complaints.
      </p>
      <p className="mt-4">
        <Link
          href="/life-events/new"
          className="inline-flex rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white focus:outline focus:outline-2 focus:outline-offset-2"
        >
          Start a life event
        </Link>
      </p>
      <p className="mt-6 text-sm text-slate-600">
        Feature flags default off. Enable{" "}
        <code>MAPABLE_CONTINUITY_OS_ENABLED</code> and{" "}
        <code>MAPABLE_LIFE_EVENTS_ENABLED</code> on the server to use the APIs.
      </p>
      <ul className="mt-6 list-disc pl-5 text-sm text-slate-700">
        <li>
          <Link href="/recovery" className="underline">
            Service recovery
          </Link>
        </li>
        <li>
          <Link href="/regional/recovery" className="underline">
            Regional recovery
          </Link>
        </li>
      </ul>
    </main>
  );
}
