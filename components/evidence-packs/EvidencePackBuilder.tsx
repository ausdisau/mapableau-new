import { EvidenceSourceSelector } from "./EvidenceSourceSelector";
import { EvidencePackExportPanel } from "./EvidencePackExportPanel";

export function EvidencePackBuilder({ packId }: { packId: string }) {
  return (
    <div className="space-y-6">
      <EvidenceSourceSelector packId={packId} />
      <EvidencePackExportPanel packId={packId} />
    </div>
  );
}
