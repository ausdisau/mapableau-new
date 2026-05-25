import { PanelSection } from "@/components/admin-panels/PanelSection";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { listParticipantDocuments } from "@/lib/documents/document-panel-service";

export const metadata = { title: "Evidence packs | Participant admin" };

export default async function ParticipantEvidencePage() {
  const user = await requireParticipantPanel();
  const docs = await listParticipantDocuments(user);
  const evidence = docs.filter((d) =>
    [
      "participant_plan",
      "service_agreement",
      "provider_registration",
      "accessibility_evidence",
    ].includes(d.category)
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Evidence packs</h1>
      <PanelSection title="Compliance & evidence documents">
        <ul className="space-y-2 text-sm">
          {evidence.map((d) => (
            <li key={d.id} className="rounded-lg border border-border px-3 py-2">
              {d.title}
            </li>
          ))}
        </ul>
        {evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">No evidence documents uploaded yet.</p>
        ) : null}
      </PanelSection>
    </div>
  );
}
