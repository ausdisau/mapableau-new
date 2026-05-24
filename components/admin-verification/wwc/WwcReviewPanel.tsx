import { WwcPrivateDetailPanel } from "@/components/verification/wwc/WwcPrivateDetailPanel";
import { WwcDecisionPanel } from "@/components/admin-verification/wwc/WwcDecisionPanel";
import { WwcTimeline } from "@/components/admin-verification/wwc/WwcTimeline";

export function WwcReviewPanel({
  verification,
}: {
  verification: {
    id: string;
    jurisdiction: string;
    checkType: string;
    checkNumber: string;
    status: string;
    legalFirstName: string;
    legalLastName: string;
    expiresAt: Date | null;
    nextCheckAt: Date | null;
    reviewNotes: string | null;
    reviewedBy: { name: string } | null;
    evidenceDocument: {
      id: string;
      title: string;
    } | null;
    events: {
      id: string;
      eventType: string;
      createdAt: Date;
      payloadJson: unknown;
    }[];
  };
}) {
  return (
    <div className="space-y-6">
      <WwcPrivateDetailPanel verification={verification} />
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Timeline</h2>
        <div className="mt-3">
          <WwcTimeline events={verification.events} />
        </div>
      </section>
      <WwcDecisionPanel verificationId={verification.id} />
    </div>
  );
}
