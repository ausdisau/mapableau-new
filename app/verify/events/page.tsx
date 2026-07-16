import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temporary events | MapAble Verify",
  description: "Temporary accessibility planning for festivals, conferences, and pop-ups.",
};

export default function VerifyEventsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Temporary event accessibility</h1>
      <p className="mt-3">
        Model temporary graphs, run synthetic passport simulations, publish event
        guides, and capture after-action lessons. Not an emergency evacuation
        certification tool.
      </p>
      <p className="mt-3">
        Flag: <code>ACCESS_INTELLIGENCE_TEMPORARY_EVENT_PLANNER</code>
      </p>
    </main>
  );
}
