import { requireAdmin } from "@/lib/auth/guards";
import { listPublishedOutcomes } from "@/lib/long-term-outcomes/outcomes-service";

export default async function LongTermOutcomesAdminPage() {
  await requireAdmin();
  const outcomes = await listPublishedOutcomes();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Long-term outcomes</h1>
      <ul className="space-y-2">
        {outcomes.map((o) => (
          <li key={o.id} className="rounded border p-3 text-sm">
            {o.outcomeKey} — {o.periodLabel}
            {o.suppressed ? " (suppressed)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
