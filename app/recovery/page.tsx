import Link from "next/link";

export const metadata = {
  title: "Service recovery | MapAble ContinuityOS",
};

export default function RecoveryHomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Service recovery</h1>
      <p className="mt-2 text-slate-700">
        Report service failures, compare recovery options and keep receipts that
        separate requests from confirmed outcomes. ContinuityOS does not auto-assign
        workers, book transport or approve refunds.
      </p>
      <ul className="mt-6 list-disc pl-5 text-sm text-slate-700">
        <li>
          <Link href="/recovery/incidents" className="underline">
            Linked incident pathways
          </Link>
        </li>
        <li>
          <Link href="/life-events" className="underline">
            Life events
          </Link>
        </li>
        <li>
          <Link href="/dashboard/safety/incidents" className="underline">
            Safety Centre incidents (canonical)
          </Link>
        </li>
      </ul>
      <p className="mt-6 text-sm text-slate-600">
        Critical terms stay visible as text: failed, unknown, replacement, cost,
        approve, decline, cancel, contact, complaint, stop, emergency.
      </p>
    </main>
  );
}
