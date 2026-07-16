import Link from "next/link";

export const metadata = {
  title: "Recovery | MapAble ContinuityOS",
  description: "Participant-controlled service recovery — never blame the person.",
};

export default function RecoveryIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900">Recovery</h1>
      <p className="mt-2 text-slate-700">
        When a service fails, ContinuityOS helps you see what changed, what
        options remain, and what you approve next. A service failure is never
        your failure.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
        <li>
          Report failures from a life-event mission (API{" "}
          <code className="text-sm">POST /api/recovery/failures</code>).
        </li>
        <li>
          Open a recovery case URL such as{" "}
          <code className="text-sm">/recovery/[recoveryId]</code>.
        </li>
        <li>
          Critical terms always stay visible: failed, unknown, replacement,
          cost, approve, decline, cancel, contact, complaint, stop, emergency.
        </li>
      </ul>
      <p className="mt-6">
        <Link href="/life-events" className="text-sky-800 underline">
          Back to life events
        </Link>
      </p>
    </main>
  );
}
