import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";

type Signal = {
  id: string;
  signalType: string;
  severity: string;
  summary: string;
  status: string;
};

export function QualityAndSafeguardsQueue({ signals }: { signals: Signal[] }) {
  return (
    <PanelSection title="Quality & safeguards queue">
      <ul className="space-y-2">
        {signals.map((s) => (
          <li key={s.id} className="rounded-lg border border-border px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="font-medium">{s.signalType}</span>
              <StatusBadge status={s.status} />
            </div>
            <p className="text-muted-foreground">{s.summary}</p>
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
