import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";

type Log = {
  id: string;
  status: string;
  summary: string | null;
  participant: { name: string };
};

export function ServiceLogReviewTable({ logs }: { logs: Log[] }) {
  return (
    <PanelSection title="Service log review">
      <ul className="space-y-2">
        {logs.map((l) => (
          <li
            key={l.id}
            className="flex justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>
              {l.participant.name} — {l.summary ?? "No summary"}
            </span>
            <StatusBadge status={l.status} />
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
