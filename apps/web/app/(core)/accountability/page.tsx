import { listPublicAccountabilityReports } from "@/lib/national-accountability/accountability-service";

export default async function AccountabilityPortalPage() {
  const reports = await listPublicAccountabilityReports();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">National accountability portal</h1>
      <p className="text-muted-foreground">
        Published aggregate accountability reports — no participant-identifiable data.
      </p>
      <ul className="space-y-4">
        {reports.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{r.title}</h2>
            <p className="text-sm">{r.summary}</p>
            <p className="text-xs text-muted-foreground">
              {r.category} — {r.periodLabel}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
