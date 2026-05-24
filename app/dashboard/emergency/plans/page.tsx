import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listEvacuationPlans } from "@/lib/emergency/evacuation-service";

export default async function EvacuationPlansPage() {
  const user = await requirePermission("emergency:read:self");
  const plans = await listEvacuationPlans(user.id);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/emergency" className="text-sm text-primary underline">
        ← Emergency
      </Link>
      <header className="flex flex-wrap justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Evacuation plans</h1>
        <Link
          href="/dashboard/emergency/plans/new"
          className="min-h-11 inline-flex items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground"
        >
          New plan
        </Link>
      </header>
      {plans.length === 0 ? (
        <p role="status">No evacuation plans yet.</p>
      ) : (
        <ul className="space-y-4">
          {plans.map((p) => (
            <li key={p.id} className="rounded-xl border border-border p-4">
              <h2 className="font-medium">
                {p.title} ({p.planType.replace(/_/g, " ")})
              </h2>
              {p.meetingPoint ? (
                <p className="text-sm mt-1">Meeting point: {p.meetingPoint}</p>
              ) : null}
              <ol className="mt-3 list-decimal pl-5 text-sm space-y-1">
                {p.steps.map((s) => (
                  <li key={s.id}>{s.instruction}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
