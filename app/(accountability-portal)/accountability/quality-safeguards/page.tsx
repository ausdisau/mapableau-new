import { DomainPlaceholder } from "@/components/accountability/DomainPlaceholder";
import { ACCOUNTABILITY_EXTERNAL_REPORTING_DISCLAIMER } from "@/lib/config/accountability";

export default function AccountabilityQualitySafeguardsPage() {
  return (
    <div className="space-y-4">
      <DomainPlaceholder
        title="Quality and Safeguards"
        description="Aggregated safeguarding and quality outcomes with status language that does not treat allegations as facts."
        explain="Aggregated publication does not replace formal complaint, emergency, police or regulatory reporting pathways."
      />
      <aside
        role="note"
        className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      >
        {ACCOUNTABILITY_EXTERNAL_REPORTING_DISCLAIMER} External reporting
        destinations are managed through a configurable resource directory, not
        hard-coded into this page.
      </aside>
    </div>
  );
}
