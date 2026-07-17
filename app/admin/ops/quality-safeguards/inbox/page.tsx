import { Suspense } from "react";

import { QsOpsShell } from "@/components/admin/quality-safeguards/QsOpsShell";
import { SafeguardsInbox } from "@/components/admin/quality-safeguards/SafeguardsInbox";

export const metadata = {
  title: "Safeguards inbox | MapAble Admin",
};

export default function QualitySafeguardsInboxPage() {
  return (
    <QsOpsShell
      title="Safeguards inbox"
      description="Unified queue for safety and quality signals. Triage, link, convert, or dismiss with a recorded reason."
      breadcrumbExtra={[
        { label: "Inbox", href: "/admin/ops/quality-safeguards/inbox" },
      ]}
    >
      <Suspense
        fallback={<p className="text-muted-foreground">Loading inbox…</p>}
      >
        <SafeguardsInbox />
      </Suspense>
    </QsOpsShell>
  );
}
