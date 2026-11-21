import { AccessSignalsExplorer } from "@/components/access-signals/AccessSignalsExplorer";
import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { ExploreAccessView } from "@/components/access-signals/ExploreAccessView";
import { isAccessSignalsEnabled } from "@/lib/access/signals/flags";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Access Signals — illustrative workspace | MapAble",
  description:
    "Explore fictional accessibility examples. No live place assessment or published rating is provided.",
};

export default function AccessSignalsExplorePage() {
  if (isAccessSignalsEnabled()) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-6" data-testid="access-signals-page">
        <header className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#005B7F]">
            Access Signals
          </p>
          <h1 className="font-heading text-3xl font-bold text-[#0C1833]">
            Synthetic placemaking RAG
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Deterministic red / amber / green / unknown signals for a fictional
            precinct. Distinct from Access Compatibility and Access Passport.
          </p>
        </header>
        <AccessSignalsExplorer />
      </main>
    );
  }

  return (
    <AccessSignalsShell activePath="/access-signals">
      <ExploreAccessView />
    </AccessSignalsShell>
  );
}
