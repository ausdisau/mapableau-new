import { PanelSection } from "@/components/admin-panels/PanelSection";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { listParticipantDocuments } from "@/lib/documents/document-panel-service";

export const metadata = { title: "Documents | Participant admin" };

export default async function ParticipantDocumentsPage() {
  const user = await requireParticipantPanel();
  const docs = await listParticipantDocuments(user);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Documents</h1>
      <PanelSection title="Your documents">
        <ul className="space-y-2 text-sm">
          {docs.map((d) => (
            <li key={d.id} className="rounded-lg border border-border px-3 py-2">
              {d.title} · {d.category}
            </li>
          ))}
        </ul>
      </PanelSection>
    </div>
  );
}
