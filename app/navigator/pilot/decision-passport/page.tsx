import { DecisionPassportPanel } from "@/components/navigator/pilot/DecisionPassportPanel";
import { DECISION_PASSPORT_A11Y_FIXTURE } from "@/lib/navigator/pilot/decision-passport-fixture";

export const metadata = {
  title: "Decision Passport preview | MapAble Navigator",
  description:
    "Synthetic Decision Passport shell for accessibility verification. Not a live participant record.",
};

/**
 * Public synthetic shell for accessibility and co-design review.
 * Does not enable write APIs or load real participant data.
 */
export default function NavigatorDecisionPassportPreviewPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <p className="border-b border-stone-200 bg-amber-50 px-4 py-2 text-sm text-stone-800">
        Synthetic preview only — no real participant information. Navigator
        write APIs remain flag-gated and default off.
      </p>
      <DecisionPassportPanel passport={DECISION_PASSPORT_A11Y_FIXTURE} />
    </main>
  );
}
