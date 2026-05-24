import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { listPrivacyIncidents } from "@/lib/privacy/privacy-incident-service";

export const metadata = { title: "Privacy incidents | Admin" };

export default async function PrivacyIncidentsPage() {
  await requireAdmin();
  const incidents = await listPrivacyIncidents();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Privacy incidents</h1>
      <p className="text-sm text-muted-foreground">
        Track containment and assessment. This tool does not provide legal advice.
      </p>
      <ul className="divide-y rounded-lg border">
        {incidents.map((i) => (
          <li key={i.id} className="p-4">
            <div className="font-medium">{i.type}</div>
            <div className="text-sm text-muted-foreground">{i.summary}</div>
            <div className="mt-1 text-xs">Status: {i.status}</div>
          </li>
        ))}
      </ul>
      <Link href="/admin/audit-events" className="text-sm text-primary underline">
        View related audit events
      </Link>
    </div>
  );
}
