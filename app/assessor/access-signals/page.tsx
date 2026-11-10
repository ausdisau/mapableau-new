import { notFound } from "next/navigation";

import { AssessorAccessSignalsClient } from "@/components/access-signals/AssessorAccessSignalsClient";
import { isAccessSignalsEnabled } from "@/lib/access/signals/flags";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Assessor · Access Signals | MapAble",
};

export default async function AssessorAccessSignalsPage() {
  if (!isAccessSignalsEnabled()) {
    notFound();
  }
  await requirePermission("assessor:portal");

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6" data-testid="assessor-access-signals">
      <header className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#005B7F]">
          Field auditor (synthetic)
        </p>
        <h1 className="font-heading text-2xl font-bold text-[#0C1833]">
          Access Signals assessment
        </h1>
        <p className="text-sm text-slate-600">
          Drafts stay in a session synthetic store — not production AccessPlace
          or Compatibility records. Overrides require an explicit reason.
        </p>
      </header>
      <AssessorAccessSignalsClient />
    </main>
  );
}
