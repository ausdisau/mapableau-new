import { notFound } from "next/navigation";

import { AdminAccessSignalsClient } from "@/components/access-signals/AdminAccessSignalsClient";
import { isAccessSignalsEnabled } from "@/lib/access/signals/flags";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Access Signals | MapAble",
};

export default async function AdminAccessSignalsPage() {
  if (!isAccessSignalsEnabled()) {
    notFound();
  }
  await requireAdmin();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6" data-testid="admin-access-signals">
      <header className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#005B7F]">
          Placemaking (synthetic)
        </p>
        <h1 className="font-heading text-2xl font-bold text-[#0C1833]">
          Access Signals remediation
        </h1>
        <p className="text-sm text-slate-600">
          Closed work never auto-promotes RAG to Green. No live council
          integrations in this prototype.
        </p>
      </header>
      <AdminAccessSignalsClient />
    </main>
  );
}
