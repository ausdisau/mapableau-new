import type { Metadata } from "next";

import { EventPlannerClient } from "@/components/access-intelligence/event-planner-client";

export const metadata: Metadata = {
  title: "Temporary events | MapAble Verify",
  description: "Temporary event accessibility planning distinct from permanent place baselines.",
};

export default function VerifyEventsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Temporary event access planning</h1>
      <p className="mt-3">
        Model temporary elements and routes, simulate synthetic passports, and
        publish event-day guides — not emergency evacuation certificates.
      </p>
      <div className="mt-6">
        <EventPlannerClient />
      </div>
    </main>
  );
}
