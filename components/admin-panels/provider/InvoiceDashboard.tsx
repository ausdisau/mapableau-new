import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";

type Inv = {
  id: string;
  status: string;
  totalCents: number;
  participant: { name: string };
};

export function InvoiceDashboard({ invoices }: { invoices: Inv[] }) {
  return (
    <PanelSection title="Invoices">
      <ul className="space-y-2">
        {invoices.map((i) => (
          <li
            key={i.id}
            className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>
              {i.participant.name} · ${(i.totalCents / 100).toFixed(2)}
            </span>
            <StatusBadge status={i.status} />
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
