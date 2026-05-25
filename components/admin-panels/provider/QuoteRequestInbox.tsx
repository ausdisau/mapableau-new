import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";

type Quote = {
  id: string;
  status: string;
  participant: { name: string };
  jobPost: { title: string } | null;
};

export function QuoteRequestInbox({ quotes }: { quotes: Quote[] }) {
  return (
    <PanelSection title="Quote request inbox">
      <ul className="space-y-2">
        {quotes.map((q) => (
          <li
            key={q.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>
              {q.jobPost?.title ?? "Support request"} — {q.participant.name}
            </span>
            <StatusBadge status={q.status} />
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
