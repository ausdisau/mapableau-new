import Link from "next/link";

export const metadata = {
  title: "Life events | MapAble ContinuityOS",
  description: "Plan life events with visible dependencies and participant authority.",
};

export default function LifeEventsIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900">Life events</h1>
      <p className="mt-2 text-slate-700">
        ContinuityOS helps you plan changes across care, transport, work and home.
        You decide. MapAble services execute only after your approval.
      </p>
      <ul className="mt-6 space-y-3 text-base">
        <li>
          <Link className="text-sky-800 underline" href="/life-events/new">
            Start a new life event
          </Link>
        </li>
        <li>
          <Link className="text-sky-800 underline" href="/recovery">
            Open recovery
          </Link>
        </li>
      </ul>
      <p className="mt-8 text-sm text-slate-600">
        Feature flags default off. Essential planning and recovery are not
        paywalled when enabled.
      </p>
    </main>
  );
}
