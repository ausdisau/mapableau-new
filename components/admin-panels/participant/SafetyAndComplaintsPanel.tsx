import Link from "next/link";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Complaint, IncidentReport } from "@prisma/client";

export function SafetyAndComplaintsPanel({
  complaints,
  incidents,
}: {
  complaints: Complaint[];
  incidents: Pick<IncidentReport, "id" | "title" | "status" | "createdAt" | "safeguardingConcern">[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PanelSection
        title="Complaints"
        description="Safeguarding matters are kept separate from general messages."
      >
        <ul className="space-y-2">
          {complaints.map((c) => (
            <li key={c.id} className="rounded-lg border border-border px-3 py-2 text-sm">
              <span className="font-medium">{c.category}</span>
              <StatusBadge status={c.status} className="ml-2" />
            </li>
          ))}
        </ul>
        <Link href="/participant/complaints" className="mt-3 text-sm text-primary hover:underline">
          Manage complaints →
        </Link>
      </PanelSection>
      <PanelSection title="Incidents & concerns">
        <ul className="space-y-2">
          {incidents.map((i) => (
            <li key={i.id} className="rounded-lg border border-border px-3 py-2 text-sm">
              {i.title}
              {i.safeguardingConcern ? (
                <span className="ml-2 text-xs font-semibold text-destructive">
                  Safeguarding
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <Link href="/participant/incidents" className="mt-3 text-sm text-primary hover:underline">
          View incidents →
        </Link>
      </PanelSection>
    </div>
  );
}
